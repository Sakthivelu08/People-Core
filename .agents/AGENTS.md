# Custom Agent Rules for People-Core

These rules guide the coding agent when making changes or running commands within this workspace.

1. **RFP Document Alignment**: Follow the RFP document of this `People-Core` project (`RFP_Proposal_For_S4-I-04.docx`) and align with its core goals and tech stack choices for any architectural or code changes.
2. **Minimize Code Comments**: Avoid adding redundant or unnecessary comments in code files. Write self-documenting code.
3. **Strict Command Constraint**: Only execute terminal commands that are explicitly requested or agreed upon by the user. Do not run unsolicited test commands or other secondary tasks.
4. **Planning Mode Default**: Do not write code or perform file modifications unless explicitly requested in the user's query. Always present plans, options, and conceptual details first to align on decisions.
5. **Clean Architecture & Decoupled Logic**: Adhere to industry best practices by writing highly decoupled, reusable code modules. Keep all configuration constants, external API paths, and environment settings in centralized files (such as `.env` on the server and `environment.ts` or constants modules on the client).
6. **UI Design Sizing & Icon Constraints**: Do not use raw emojis in the user interface; use Material Icons instead. Design compact, clean, and professional UIs with smaller, refined typography, margins, and paddings (matching production-ready corporate dashboards rather than large/bulky layouts).
7. **Component Reusability First**: Prioritize creating decoupled, reusable components, utility methods, and helper functions. Ensure common visual blocks (e.g. metrics widgets, data tables, dropdowns, and input controls) and formatting tasks (e.g. date conversion and beautification) are centralized and reused across the application to prevent code duplication and facilitate future scalability.
8. **Backward Compatibility & Non-Breaking Enhancements**: Any future feature enhancements, UI additions, or API changes MUST preserve 100% backward compatibility with all existing app functionality, CI/CD deployment pipelines, unit tests, and live production environments. Never break or refactor existing working production features or working workflows unless explicitly requested by the user.
