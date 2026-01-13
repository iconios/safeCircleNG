// Read organization service
/*
#Plan:
1. Accept and validate company code
2. Fetch the organization if it exists
3. Send response to the user
*/

import { ZodError } from "zod";
import {
  organizationInputDTO,
  organizationInputSchema,
} from "../../types/organization.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const readOrganizationService = async (
  readOrganizationInput: organizationInputDTO,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate company code
    const { company_code } = organizationInputSchema.parse({
      ...readOrganizationInput,
      company_code: readOrganizationInput.company_code.toUpperCase(),
    });

    // 2. Fetch the organization if it exists
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select(
        "id, name, slug, company_code, description, contact_email, contact_phone, contact_person, status, subscription_tier, max_employees, employee_count, trial_start_date, trial_end_date, created_at, updated_at",
      )
      .eq("company_code", company_code)
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error fetching organization",
        data: null,
        error: {
          code: "ORGANIZATION_FETCH_ERROR",
          details: isDev
            ? (error?.message ?? "Error fetching organization")
            : "Error fetching organization",
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
      message: "Organization fetched successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        company_code,
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("readOrganizationService error:", error);
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Invalid organization lookup input",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Invalid organization lookup input")
            : "Invalid organization lookup input",
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
        details: "Unexpected error while fetching organization",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readOrganizationService;
