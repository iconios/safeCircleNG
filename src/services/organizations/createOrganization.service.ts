// Create organization service
/*
1. Accept and validate the organization data
2. Create organization
3. Send response to user
*/

import { ZodError } from "zod";
import {
  organizationInsert,
  organizationInsertSchema,
} from "../../types/organization.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";
import { v4 as uuidv4 } from "uuid";
import generateRandomSixDigits from "../../utils/generateRandom.util.ts";
import { TRIAL_PERIOD_IN_DAYS } from "../../config/appConfig.ts";

const createOrganizationService = async (
  createOrganizationData: organizationInsert,
) => {
  const now = new Date();
  const SAFECIRCLE_BASE_URL = process.env.SAFECIRCLE_BASE_URL;
  if (!SAFECIRCLE_BASE_URL) {
    throw new Error("SAFECIRCLE_BASE_URL is not configured");
  }

  try {
    // 1. Accept and validate the organization data
    const { name, ...rest } = organizationInsertSchema.parse(
      createOrganizationData,
    );

    // 2. Create organization
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_IN_DAYS);
    const companySlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const companyCodePartial = companySlug.toUpperCase();
    const admin_secret_key = uuidv4();
    const randomNumbers = generateRandomSixDigits();
    const company_code = `${companyCodePartial}-${randomNumbers}`;
    const dashboard_url = `${SAFECIRCLE_BASE_URL}/org/${companySlug}?cc=${company_code}`;
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .insert({
        admin_secret_key,
        company_code,
        dashboard_url,
        subscription_tier: "trial",
        status: "active",
        trial_start_date: now,
        trial_end_date: trialEndDate,
        name,
        slug: companySlug,
        ...rest,
      })
      .select(
        "id, name, slug, company_code, dashboard_url, status, subscription_tier, max_employees, employee_count, trial_start_date, trial_end_date, created_at",
      )
      .single();
    if (error) {
      return {
        success: false,
        message: "Error creating organization",
        data: null,
        error: {
          code: "ORGANIZATION_CREATION_ERROR",
          details: isDev
            ? (error?.message ?? "Error creating organization")
            : "Error creating organization",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    // 3. Send response to user
    return {
      success: true,
      message: "Organization created successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("createOrganizationService failed:", error);
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Invalid organization creation input",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Invalid organization creation input")
            : "Invalid organization creation input",
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
        details: "Unexpected error while creating organization",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createOrganizationService;
