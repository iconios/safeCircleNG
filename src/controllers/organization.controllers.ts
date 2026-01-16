// Organization controller implementation
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import {
  organizationInsert,
  organizationUpdate,
} from "../types/organization.types.ts";
import createOrganizationService from "../services/organizations/createOrganization.service.ts";
import readOrganizationService from "../services/organizations/readOrganization.service.ts";
import updateOrganizationService from "../services/organizations/updateOrganization.service.ts";
import deleteOrganizationService from "../services/organizations/deleteOrganization.service.ts";

// Create organization controller
const createOrganizationController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const organizationData = req.body as organizationInsert;
    if (!organizationData) {
      return res.status(400).json({
        success: false,
        message: "Organization data is required",
        data: null,
        error: {
          code: "ORGANIZATION_DATA_REQUIRED",
          details: "Organization data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createOrganizationService(organizationData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "ORGANIZATION_CREATION_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(201).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Get organizations controller
const getOrganizationsController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const companyCode = req.params.companyCode as string;
    if (!companyCode) {
      return res.status(400).json({
        success: false,
        message: "Company code is required",
        data: null,
        error: {
          code: "COMPANY_CODE_REQUIRED",
          details: "Company code is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await readOrganizationService({ company_code: companyCode });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "ORGANIZATION_FETCH_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "ORGANIZATION_NOT_FOUND":
          return res.status(404).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Update organization controller
const updateOrganizationController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const companyCode = req.params.companyCode as string;
    if (!companyCode) {
      return res.status(400).json({
        success: false,
        message: "Company code is required",
        data: null,
        error: {
          code: "COMPANY_CODE_REQUIRED",
          details: "Company code is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }
    const organizationData = req.body as organizationUpdate;
    if (!organizationData) {
      return res.status(400).json({
        success: false,
        message: "Organization data is required",
        data: null,
        error: {
          code: "ORGANIZATION_DATA_REQUIRED",
          details: "Organization data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await updateOrganizationService(
      { company_code: companyCode },
      organizationData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "ORGANIZATION_UPDATE_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Delete organization controller
const deleteOrganizationController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const organizationId = req.params.organizationId;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization id is required",
        data: null,
        error: {
          code: "ORGANIZATION_ID_REQUIRED",
          details: "Organization id is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const companyCode = req.params.companyCode as string;
    if (!companyCode) {
      return res.status(400).json({
        success: false,
        message: "Company code is required",
        data: null,
        error: {
          code: "COMPANY_CODE_REQUIRED",
          details: "Company code is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await deleteOrganizationService({
      company_code: companyCode,
      organization_id: organizationId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "ORGANIZATION_DELETION_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "ORGANIZATION_NOT_FOUND":
          return res.status(404).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

export {
  createOrganizationController,
  getOrganizationsController,
  updateOrganizationController,
  deleteOrganizationController,
};
