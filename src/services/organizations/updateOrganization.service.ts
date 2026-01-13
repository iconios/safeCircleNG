// Update organization service
/*
#Plan:
1. Accept and validate company-code
2. Accept, validate and update organization
3. Send response to the user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import {
  organizationInputDTO,
  organizationInputSchema,
  organizationUpdate,
  organizationUpdateSchema,
} from "../../types/organization.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const updateOrganizationService = async (
  organizationInput: organizationInputDTO,
  updateOrganizationData: organizationUpdate,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate company code
    const { company_code } = organizationInputSchema.parse({
      ...organizationInput,
      company_code: organizationInput.company_code.toUpperCase(),
    });

    // 2. Accept, validate and update organization
    if (Object.keys(updateOrganizationData).length === 0) {
      return {
        success: false,
        message: "Update data empty",
        data: null,
        error: {
          code: "EMPTY_UPDATE_DATA",
          details: "Update data empty",
        },
        metadata: {
          timestamp: now.toISOString(),
          company_code,
        },
      };
    }
    const validatedInput = organizationUpdateSchema.parse(
      updateOrganizationData,
    );
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .update({ ...validatedInput })
      .eq("company_code", company_code)
      .select(
        "id, name, slug, company_code, description, contact_email, contact_phone, contact_person, status, subscription_tier, max_employees, employee_count, trial_start_date, trial_end_date, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: "Error updating organization",
        data: null,
        error: {
          code: "ORGANIZATION_UPDATE_ERROR",
          details: isDev
            ? (error?.message ?? "Error updating organization")
            : "Error updating organization",
        },
        metadata: {
          timestamp: now.toISOString(),
          company_code,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        message: "No organization found",
        data: null,
        error: {
          code: "ORGANIZATION_NOT_FOUND",
          details: "No organization found",
        },
        metadata: {
          timestamp: now.toISOString(),
          company_code,
        },
      };
    }

    // 3. Send response to the user
    return {
      success: true,
      message: "Organization updated successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        company_code,
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("updateOrganizationService error:", error);
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Invalid organization update input",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Invalid organization update input")
            : "Invalid organization update input",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while updating organization",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default updateOrganizationService;
