import express from "express";
import {
  createOrganizationController,
  deleteOrganizationController,
  getOrganizationsController,
  updateOrganizationController,
} from "../controllers/organization.controllers.ts";
const organizationRouter = express.Router();

// Organization routes
organizationRouter.post("/", createOrganizationController);
organizationRouter.get("/:companyCode", getOrganizationsController);
organizationRouter.patch("/:companyCode", updateOrganizationController);
organizationRouter.delete(
  "/:organizationId/companyCode/:companyCode",
  deleteOrganizationController,
);

export default organizationRouter;
