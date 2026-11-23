# Layout templates

The starter kit's demo pages are kept as **templates**: working pages to copy when a new page needs the same layout. They run on demo data and are registered only outside production, under `/_templates/…`.

Copy a template's page, components and layout, then replace the demo data with real props. Don't link to a template from a real page.

| Template | URL | What it shows | Files |
| --- | --- | --- | --- |
| `stats` | `/_templates/stats` | Stat cards, a chart, a sales table, and a period and date-range picker | `inertia/pages/templates/stats.vue`, `inertia/components/templates/stats/` |
| `table` | `/_templates/table` | Table with filters, column toggles, row selection, and add and delete modals | `inertia/pages/templates/table.vue`, `inertia/components/templates/table/`, `app/controllers/templates/table_controller.ts` |
| `list_detail` | `/_templates/list_detail` | List and detail view: a list beside the selected item, which opens as a slideover on small screens | `inertia/pages/templates/list_detail.vue`, `inertia/components/templates/list_detail/`, `app/controllers/templates/list_detail_controller.ts` |
| `settings_general` | `/_templates/settings` | Profile settings form: text fields, an avatar picker and a save button | `inertia/pages/templates/settings_general.vue` |
| `settings_members` | `/_templates/settings/members` | Settings page with a searchable list of members and their roles | `inertia/pages/templates/settings_members.vue`, `inertia/components/templates/settings/`, `app/controllers/templates/settings_members_controller.ts` |
| `settings_notifications` | `/_templates/settings/notifications` | Settings form of on/off switches grouped in sections | `inertia/pages/templates/settings_notifications.vue` |
| `settings_security` | `/_templates/settings/security` | Settings form for a password change, and an account-deletion section | `inertia/pages/templates/settings_security.vue` |
| `signup` | `/_templates/signup` | Auth form with several fields and server-side validation | `inertia/pages/templates/signup.vue`, `app/controllers/templates/signup_controller.ts` |

## Shared pieces

- **Layouts.** `inertia/layouts/dashboard.vue` is the sidebar shell, with search, a user menu and a notifications slideover. Its sidebar links between the templates. `inertia/layouts/settings.vue` is the settings panel with tabs. Both are used only by templates.
- **Demo data.** `app/services/demo/` holds the demo records, and `types/templates.ts` their shapes. `/_templates/notifications` serves the slideover's notifications as JSON.
- **Auth.** `inertia/layouts/auth.vue` and `inertia/pages/auth/login.vue` are not templates. They are the base of the Operator login.

## Signup

Public signup is not a route of the app. The signup template still submits, so a developer can create a user and sign in locally until the setup wizard creates the Operator.
