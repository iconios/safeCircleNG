import { z } from "zod";
import { timestamp } from "./emergency.types.ts";

export const journeySharesRowSchema = z
  .object({
    id: z.uuid(),
    journey_id: z.uuid(),
    circle_member_id: z.uuid(),
    can_view_location: z.boolean().default(true),
    created_at: timestamp.nullable(),
    organization_id: z.uuid().nullable(),
    event_id: z.uuid().nullable(),
    can_extend_time: z.boolean().default(false).nullable(),
    can_see_history: z.boolean().default(false).nullable(),
    first_viewed_at: timestamp.nullable(),
    last_viewed_at: timestamp.nullable(),
    view_count: z.number().int().default(0).nullable(),
    updated_at: timestamp.nullable(),
  })
  .strict();

export const journeySharesInsertSchema = journeySharesRowSchema
  .pick({
    can_view_location: true,
  })
  .extend({
    can_extend_time: z.boolean().default(false).optional(),
    can_see_history: z.boolean().default(false).optional(),
  })
  .strict();

export const journeySharesUpdateSchema = journeySharesRowSchema
  .pick({
    organization_id: true,
    event_id: true,
    can_extend_time: true,
    can_see_history: true,
    first_viewed_at: true,
    last_viewed_at: true,
    view_count: true,
  })
  .extend({ can_view_location: z.boolean().default(true).optional() })
  .strict();

export const journeySharesDeleteSchema = journeySharesRowSchema
  .pick({
    id: true,
  })
  .strict();

export type journeySharesRow = z.infer<typeof journeySharesRowSchema>;
export type journeySharesInsert = z.infer<typeof journeySharesInsertSchema>;
export type journeySharesUpdate = z.infer<typeof journeySharesUpdateSchema>;
export type journeySharesDelete = z.infer<typeof journeySharesDeleteSchema>;

export interface Database {
  public: {
    Tables: {
      journey_shares: {
        Row: journeySharesRow;
        insert: journeySharesInsert;
        update: journeySharesUpdate;
        delete: journeySharesDelete;
      };
    };
  };
}

export const journeySharesInputSchema = z
  .object({
    user_id: z.uuid(),
    circle_member_id: z.uuid(),
    journey_id: z.uuid(),
  })
  .strict();

export type journeySharesInputDTO = z.infer<typeof journeySharesInputSchema>;
export const deleteJourneySharesInputSchema = z.object({
  user_id: z.uuid(),
  journey_share_id: z.uuid(),
});

export type deleteJourneySharesInput = z.infer<
  typeof deleteJourneySharesInputSchema
>;
