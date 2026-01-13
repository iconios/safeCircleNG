// Delete organization service
/*
#Plan:
1. Accept and validate id and company_code
2. Delete the organization
3. Send response to the user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import {
  deleteOrganizationInputDTO,
  deleteOrganizationInputSchema,
} from "../../types/organization.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const deleteOrganizationService = async (
  organizationInput: deleteOrganizationInputDTO,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate id and company_code
    const { company_code, organization_id } =
      deleteOrganizationInputSchema.parse({        
        ...organizationInput,
        company_code: organizationInput.company_code.toUpperCase(),
      });

    // 2. Delete the organization
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .delete()
      .eq("id", organization_id)
      .eq("company_code", company_code)
      .select("id")
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error deleting organization",
        data: null,
        error: {
          code: "ORGANIZATION_DELETE_ERROR",
          details: isDev
            ? (error?.message ?? "Error deleting organization")
            : "Error deleting organization",
        },
        metadata: {
          timestamp: now.toISOString(),
          company_code,
          organization_id,
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
        }
    }

    // 3. Send response to the user
    return {
      success: true,
      message: "Organization deleted successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        company_code,
        organization_id,
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("deleteOrganizationService error:", error);
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Invalid organization delete input",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Invalid organization delete input")
            : "Invalid organization delete input",
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
        details: "Unexpected error while deleting organization",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default deleteOrganizationService;
