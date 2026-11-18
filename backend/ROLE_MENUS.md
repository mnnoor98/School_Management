# Role menus

Select a campus as Super Admin, then open **Administration → Role Menu Permissions**. Choose the target role, enable **View** for its screens, configure actions, and save. The editor loads the actual database menu catalog and current campus matrix, with loading/error states and protection against stale role selections.

Turning View off clears that screen's action flags. Enabling an action enables View. Group checkboxes affect their children; a group never grants access to a sibling screen. Empty, hidden and inactive menu branches are omitted from navigation. Explicit user View denies also hide the denied branch. Super Admin has full access and its matrix is read-only; administration screens cannot be granted to ordinary roles.

Menu grants govern sidebar visibility, route navigation and permission-aware UI controls. Existing API authorization remains in place, and the permission engine evaluates the same exact menu decisions for backend callers. This update does not add new menu-policy checks to every existing business CRUD endpoint.

The catalog synchronizer adds missing screens and initial grants for newly introduced menu codes only. It preserves existing assignments and explicit denials, including rows saved before the corresponding menu existed. Synchronization is idempotent and does not require a schema migration. Newly created campuses still require explicit role configuration.

Default grants for newly introduced screens follow these role profiles:

| Role | Default menu areas |
| --- | --- |
| Super Admin | All active, visible screens, including administration |
| Teacher | Student directory, academic screens, teacher directory/leave, attendance, examinations, notices and academic reports |
| Accountant | Student directory, fees, invoices, collection, notices and financial reports |
| Student / Guardian | Student directory, routine, attendance reports, marksheets, fee collection/statements and notices |

Existing custom rights are not reset to these defaults. Unknown/custom roles receive no automatic grants.

Users refresh their menu access on navigation, browser focus and every 30 seconds while signed in. A revoked current screen redirects to the dashboard. The dashboard remains a landing page for roles with no assigned menus and shows an access message instead of dashboard data. Route aliases map only equivalent legacy screen codes; parent and sibling permissions are never used as substitutes.

Validation covers cross-campus isolation, invalid or duplicate matrix rows, missing View, administrator-only menus, user denies, sibling isolation, hidden menus and preservation of custom grants. The PostgreSQL verifier also checks catalog synchronization and idempotence against a disposable real database.
