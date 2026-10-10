import json
from pathlib import Path

import django.contrib.admin
from django.contrib import messages
from django.core.serializers.json import DjangoJSONEncoder
from django.template.loader import select_template
from django.template.response import SimpleTemplateResponse, TemplateResponse
from django.utils.deprecation import MiddlewareMixin

from .admin import ShadcnAdminSite
from .descriptors import page_descriptor

STANDARD = {
    "admin/index.html",
    "admin/app_index.html",
    "admin/change_list.html",
    "admin/change_form.html",
    "admin/delete_confirmation.html",
    "admin/delete_selected_confirmation.html",
    "admin/object_history.html",
    "admin/login.html",
    "admin/auth/user/change_password.html",
    "registration/password_change_form.html",
    "admin/auth/user/add_form.html",
}


class DescriptorResponse(SimpleTemplateResponse):
    def __init__(self, descriptor, status):
        self.descriptor = descriptor
        super().__init__(template="", status=status, content_type="application/json")

    @property
    def rendered_content(self):
        return json.dumps(self.descriptor, cls=DjangoJSONEncoder, ensure_ascii=False)


class ShadcnResponseMiddleware(MiddlewareMixin):
    def process_template_response(self, request, response):
        context = response.context_data or {}
        site = context.get("_shadcn_site")
        if site is None and context.get("popup_response_data"):
            site = getattr(getattr(request, "resolver_match", None), "func", None)
            site = getattr(site, "model_admin", None)
            site = getattr(site, "admin_site", None)
        if not isinstance(site, ShadcnAdminSite):
            return response
        templates = response.template_name
        templates = [templates] if isinstance(templates, str) else templates
        selected = select_template(templates)
        template_name = selected.origin.template_name
        admin_templates = Path(django.contrib.admin.__file__).parent / "templates"
        if (
            template_name == "admin/popup_response.html"
            and context.get("popup_response_data")
            and Path(selected.origin.name).is_relative_to(admin_templates)
        ):
            result = TemplateResponse(request, "django_shadcn/popup_response.html",
                {**context, "result": json.loads(context["popup_response_data"])}, status=response.status_code)
            for header, value in response.items():
                if header.lower() != "content-type":
                    result[header] = value
            result.cookies.update(response.cookies)
            result["X-Frame-Options"] = "SAMEORIGIN"
            result.xframe_options_exempt = True
            return result
        is_catalog = context.get("_shadcn_catalog")
        if not is_catalog and (
            template_name not in STANDARD
            or not Path(selected.origin.name).is_relative_to(admin_templates)
        ):
            # Model/app/project template overrides retain all native behavior.
            return response
        descriptor = page_descriptor(context, request, site, template_name)
        descriptor["messages"] = [
            {"level": message.tags, "text": str(message)}
            for message in messages.get_messages(request)
        ]
        if request.headers.get("Accept") == "application/vnd.django-shadcn+json":
            result = DescriptorResponse(descriptor, status=response.status_code)
        else:
            result = TemplateResponse(
                request,
                "django_shadcn/shell.html",
                {**context, "shadcn": descriptor},
                status=response.status_code,
            )
        for header, value in response.items():
            if header.lower() != "content-type":
                result[header] = value
        result.cookies.update(response.cookies)
        if descriptor.get("popup"):
            result["X-Frame-Options"] = "SAMEORIGIN"
            result.xframe_options_exempt = True
        return result
