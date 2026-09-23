// What a crowd worker can be sent to do.
//
// One source for the checkboxes and the labels, the same arrangement
// features/marketplace/vocabularies.ts describes: this list is a CHECK
// constraint in db/190_worker_skills.sql and a Literal in
// backend/src/sourcehub/api/v1/network.py, and building the picker from here
// is what stops the console offering a value that comes back as a 422.
//
// The values are not invented. docs/sourcehub-app.html:833-841 — the prototype
// this console was ported from — authored these nine and seeded its roster
// with them. It never built an ADD form, which is how the port ended up with a
// free-text box and, on the pilot database, four workers whose skills read
// 'Proficient', 'work', 'all' and nothing at all.
//
// Choice, labelOf and labelsOf live in the marketplace vocabulary file. They
// are general helpers in a feature-shaped home; moving them to @shared is the
// right refactor and a separate one.

import type { Choice } from "@features/marketplace/vocabularies";
import type { Skill } from "@api/types";

export const SKILLS: Choice<Skill>[] = [
  { value: "shelf_capture", label: "Shelf capture" },
  { value: "retail_audit", label: "Retail audit" },
  { value: "street_imagery", label: "Street imagery" },
  { value: "field_survey", label: "Field survey" },
  { value: "household_survey", label: "Household survey" },
  { value: "voice_capture", label: "Voice capture" },
  { value: "transcription", label: "Transcription" },
  { value: "night_driving", label: "Night driving" },
  { value: "drone_operation", label: "Drone operation" },
];
