# MCP Server → Odoo 17 → Claude Pro

## Complete Build and Deployment Process

**Project purpose:** Build a lightweight MCP Server that acts as the
controlled bridge between Claude Pro and Odoo 17.

**Primary architecture:**

``` text
Claude Pro
    │
    │ MCP / HTTPS
    ▼
Vercel
    │
    │ MCP Server
    │
    │ Odoo API
    ▼
Odoo 17
```

## 1. Core Understanding

The most important concept is:

> **MCP is the middle layer that allows Claude to access controlled
> tools/data exposed by our server.**

MCP is not Odoo, and MCP is not Claude.

  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  GitHub                              Stores and versions the source code

  Vercel                              Hosts/runs the deployed MCP
                                      application

  Next.js                             Application framework used for the
                                      Vercel deployment

  MCP Server                          Controlled bridge exposing tools to
                                      Claude

  MCP Protocol                        Standard communication protocol
                                      between Claude and the MCP server

  Claude Pro                          MCP client/AI interface

  Odoo 17                             Authoritative business-data source

  MCP Inspector                       Used to test the MCP server before
                                      connecting Claude
  -----------------------------------------------------------------------

The desired data flow is:

``` text
Claude Pro
    ↓
MCP Tool Request
    ↓
MCP Server
    ↓
Controlled Odoo API Call
    ↓
Odoo 17
    ↓
Result
    ↓
MCP Server
    ↓
Claude Pro
```

Claude should not directly connect to the Odoo database.

Claude should not have arbitrary access to Odoo models or methods.

The MCP Server should expose only the tools that we explicitly create.

------------------------------------------------------------------------

# 2. Project Goals

The project will eventually allow Claude Pro to ask questions such as:

-   Find a customer.
-   Get customer information.
-   Search products.
-   Search sales orders.
-   Get a sales order.
-   Get sales summaries.
-   Generate an approved report.
-   Export an Excel report.
-   Export a PDF report.

All business information must originate from Odoo 17.

The initial implementation should be:

-   Read-only.
-   Controlled.
-   Auditable.
-   Tool-based.
-   No arbitrary Odoo model execution.
-   No direct PostgreSQL access from Claude.
-   No Odoo write operations initially.

------------------------------------------------------------------------

# 3. Important Source-of-Truth Rule

Odoo 17 is the authoritative business-data source.

The MCP Server must not invent, estimate, cache as an independent
business database, or substitute external information for Odoo data.

For example:

``` text
Claude:
"What were total sales for September?"

        ↓

MCP Server

        ↓

Dedicated Odoo reporting tool

        ↓

Odoo 17

        ↓

Actual Odoo figures

        ↓

MCP Server

        ↓

Claude
```

Claude may explain the returned information, but the underlying business
figures must come from Odoo.

------------------------------------------------------------------------

# 4. Report Integrity Rule

For reports, preserve the existing controlled reporting architecture.

The intended flow is:

``` text
Claude
   ↓
MCP report tool
   ↓
Fixed report resolver
   ↓
Tool Executor
   ↓
Odoo 17
   ↓
Excel / PDF
```

The LLM must not calculate or determine report figures through its model
reasoning.

The report tool should invoke the existing fixed resolver/tool-executor
path.

This means:

``` text
LLM
  └── requests report
          ↓
     Fixed backend path
          ↓
     Odoo source data
          ↓
     Generated report
```

This separation is important for report accuracy and auditability.

------------------------------------------------------------------------

# 5. Development Strategy

Build the project incrementally.

## Phase 1 --- Create the GitHub repository

Create a repository such as:

``` text
odoo-mcp-server
```

GitHub is only the source-code repository.

It does not run the MCP Server.

------------------------------------------------------------------------

## Phase 2 --- Create the Vercel project

Use Vercel as the hosting platform.

The intended deployment is:

``` text
GitHub
   ↓
Vercel
   ↓
Next.js application
   ↓
MCP endpoint
```

The Vercel project should be connected to the GitHub repository.

### Application Preset

Use:

``` text
Next.js
```

The MCP implementation will be added to the Next.js application.

Do not connect Odoo at this stage.

Do not connect Claude at this stage.

------------------------------------------------------------------------

# 6. Why Next.js?

Vercel is designed around its Next.js deployment workflow.

Using Next.js allows the project to have:

-   A Vercel-native deployment.
-   HTTPS automatically provided by Vercel.
-   API/route handling.
-   Environment variables.
-   GitHub deployment integration.
-   An MCP endpoint implemented inside the application.

The goal is not to build a traditional website.

Next.js is primarily the application framework/container in which the
MCP endpoint will run.

------------------------------------------------------------------------

# 7. Phase 3 --- Create the Smallest MCP Server

Before Odoo is involved, create a simple MCP server.

The first tool should be:

``` text
hello()
```

Example conceptual response:

``` text
Hello from the Odoo MCP Server.
```

The first objective is simply proving:

``` text
MCP Client
    ↓
MCP Server
    ↓
hello()
    ↓
Response
```

No Odoo is required.

No database is required.

No Claude connection is required.

------------------------------------------------------------------------

# 8. Phase 4 --- Test with MCP Inspector

Before connecting Claude Pro, test the MCP Server with MCP Inspector.

The purpose is to verify:

-   The MCP endpoint is reachable.
-   The MCP protocol works.
-   The server initializes correctly.
-   Tools are listed.
-   Tool parameters are accepted.
-   Tool results are returned correctly.

Expected progression:

``` text
MCP Server
    ↓
MCP Inspector
    ↓
hello()
    ↓
Successful response
```

Only after this works should we continue.

------------------------------------------------------------------------

# 9. Phase 5 --- Add More Test Tools

Before touching Odoo, add simple tools to understand MCP.

Example:

``` text
hello()
get_server_status()
get_current_time()
calculate()
```

Example:

``` text
calculate(
    operation,
    value1,
    value2
)
```

This phase teaches how MCP tools receive structured input and return
structured output.

------------------------------------------------------------------------

# 10. Phase 6 --- Define the MCP Tool Architecture

Once the basic MCP server works, organize tools into logical modules.

Possible structure:

``` text
odoo-mcp-server/
├── app/
│   └── api/
│       └── mcp/
│           └── route.ts
│
├── src/
│   ├── tools/
│   │   ├── customers.ts
│   │   ├── products.ts
│   │   ├── sales.ts
│   │   ├── invoices.ts
│   │   └── reports.ts
│   │
│   ├── odoo/
│   │   └── client.ts
│   │
│   ├── reports/
│   │   └── resolver.ts
│   │
│   └── security/
│       └── auth.ts
│
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

The exact structure can change as implementation details become clear.

------------------------------------------------------------------------

# 11. Phase 7 --- Connect MCP Server to Odoo

Only after the MCP layer works independently should Odoo be connected.

The architecture becomes:

``` text
Claude
   ↓
MCP
   ↓
MCP Server
   ↓
Odoo Client
   ↓
Odoo 17 API
```

The MCP Server should have a dedicated Odoo integration layer.

For example:

``` text
src/odoo/client.ts
```

Its responsibility is communication with Odoo.

The MCP tools should not contain duplicated low-level Odoo
authentication logic.

------------------------------------------------------------------------

# 12. Odoo Authentication

Use a dedicated Odoo integration account.

Initially:

``` text
READ ONLY
```

The MCP Server should authenticate to Odoo using the approved Odoo API
mechanism.

Credentials should be stored as Vercel environment variables.

Example conceptual variables:

``` text
ODOO_URL=
ODOO_DATABASE=
ODOO_USERNAME=
ODOO_PASSWORD=
```

Never commit real credentials to GitHub.

Use:

``` text
.env.example
```

for documentation only.

Example:

``` text
ODOO_URL=
ODOO_DATABASE=
ODOO_USERNAME=
ODOO_PASSWORD=
```

The actual values belong in Vercel Environment Variables.

------------------------------------------------------------------------

# 13. First Odoo MCP Tools

Start with a small number of read-only tools.

Possible first tools:

``` text
search_customers
get_customer
search_products
get_product
search_sales_orders
get_sales_order
```

Then add reporting tools:

``` text
get_sales_summary
get_sales_by_customer
get_sales_by_product
```

Then export tools:

``` text
export_sales_excel
export_sales_pdf
```

Do not expose a generic tool such as:

``` text
execute_any_odoo_method()
```

or:

``` text
execute_any_odoo_model()
```

That would unnecessarily expand the security boundary.

------------------------------------------------------------------------

# 14. Odoo Tool Design

Each MCP tool should have:

1.  A clear name.
2.  A clear description.
3.  Explicit input parameters.
4.  Input validation.
5.  A controlled Odoo operation.
6.  A predictable response format.
7.  Appropriate error handling.

Example:

``` text
search_customers
```

Input:

``` text
search term
limit
```

Output:

``` json
{
  "customers": [
    {
      "id": 123,
      "name": "Example Customer",
      "email": "customer@example.com"
    }
  ]
}
```

The tool should only retrieve the information necessary for the request.

------------------------------------------------------------------------

# 15. Phase 8 --- Reports

Reports should use dedicated MCP tools.

For example:

``` text
generate_sales_report
```

The MCP tool should not ask Claude to calculate the report.

Instead:

``` text
Claude
   ↓
generate_sales_report
   ↓
Fixed Resolver
   ↓
Tool Executor
   ↓
Odoo
   ↓
Report Generator
   ↓
Excel/PDF
```

The MCP layer is an access mechanism, not the source of report
calculations.

------------------------------------------------------------------------

# 16. Report Export

For an Excel report:

``` text
Claude
   ↓
MCP export_sales_excel
   ↓
Fixed report resolver
   ↓
Tool Executor
   ↓
Odoo
   ↓
Excel generator
   ↓
File
```

For a PDF:

``` text
Claude
   ↓
MCP export_sales_pdf
   ↓
Fixed report resolver
   ↓
Tool Executor
   ↓
Odoo
   ↓
PDF generator
   ↓
File
```

The MCP response should provide the appropriate file/result information
according to the final implementation.

------------------------------------------------------------------------

# 17. Phase 9 --- Security

Security should be added before exposing the MCP Server to Claude Pro
for real business use.

Minimum areas:

### MCP authentication

Only authorized MCP clients should access the endpoint.

### Odoo authentication

The MCP Server uses a dedicated Odoo account.

### Tool authorization

Only explicitly implemented tools are available.

### Input validation

All MCP tool parameters must be validated.

### Rate limiting

Consider limiting repeated requests.

### Logging

Record:

-   Request time.
-   Tool name.
-   Request/user context where appropriate.
-   Odoo operation.
-   Success/failure.
-   Error information.

Do not log passwords or sensitive credentials.

------------------------------------------------------------------------

# 18. Phase 10 --- Claude Pro Connection

Only after the MCP Server works independently should Claude Pro be
connected.

Final architecture:

``` text
┌────────────────────┐
│     Claude Pro     │
└─────────┬──────────┘
          │
          │ MCP
          ▼
┌────────────────────┐
│      Vercel        │
│                    │
│    MCP Server      │
│                    │
│  ┌──────────────┐  │
│  │ MCP Tools   │  │
│  └──────┬───────┘  │
└─────────┼──────────┘
          │
          │ Odoo API
          ▼
┌────────────────────┐
│      Odoo 17       │
│                    │
│ Source of Truth    │
└────────────────────┘
```

Claude becomes the interface used to request information.

The MCP Server controls what Claude is allowed to access.

Odoo remains the business-data source.

------------------------------------------------------------------------

# 19. What Claude Should Be Allowed to Do

Initially:

``` text
READ
```

Examples:

``` text
"Find customer ABC."

"Show me customer ABC's information."

"Find sales orders for customer ABC."

"What are total sales for September?"

"Generate the September sales report."
```

The MCP Server translates those requests into approved tools.

------------------------------------------------------------------------

# 20. What Claude Should NOT Do Initially

Do not initially allow:

``` text
Create customer
Update customer
Delete customer
Create invoice
Change invoice
Cancel order
Delete order
Modify accounting data
Execute arbitrary Odoo method
Execute arbitrary SQL
```

The first version should remain read-only.

Write access can be evaluated separately after the read-only system is
stable and secured.

------------------------------------------------------------------------

# 21. Network Architecture

There are two important network connections.

### Connection 1 --- Claude → MCP

``` text
Claude Pro
    ↓
HTTPS
    ↓
Vercel MCP Server
```

### Connection 2 --- MCP → Odoo

``` text
Vercel MCP Server
    ↓
HTTPS / Odoo API
    ↓
Odoo 17
```

Therefore Odoo must be reachable by the MCP Server.

If Odoo is private/local:

``` text
Vercel
   X
   │
   │ cannot directly reach private LAN
   ▼
Private Odoo
```

A secure network solution may be required.

If Odoo already has an accessible HTTPS API:

``` text
Vercel
   │
   │ HTTPS
   ▼
Odoo
```

This is simpler.

------------------------------------------------------------------------

# 22. Environment Separation

Use separate environments where practical:

``` text
Development
    ↓
Testing
    ↓
Production
```

Do not test destructive operations against production Odoo.

For the first implementation, use read-only operations even in
production.

------------------------------------------------------------------------

# 23. GitHub Workflow

The development workflow is:

``` text
Developer
    ↓
Edit code
    ↓
Git commit
    ↓
GitHub
    ↓
Vercel deployment
    ↓
MCP Server
```

Example:

``` bash
git add .
git commit -m "Add customer MCP tool"
git push
```

Vercel can then deploy the updated GitHub commit.

GitHub is therefore the source-code repository, not the runtime.

------------------------------------------------------------------------

# 24. Vercel Workflow

Vercel provides the runtime/deployment layer.

Conceptually:

``` text
GitHub repository
        ↓
Vercel detects commit
        ↓
Build
        ↓
Deploy
        ↓
HTTPS MCP endpoint
```

Environment variables should be configured in Vercel rather than
committed to GitHub.

------------------------------------------------------------------------

# 25. Local Development vs Production

During development:

``` text
Developer PC
    ↓
Next.js
    ↓
MCP Server
    ↓
MCP Inspector
```

Production:

``` text
Claude Pro
    ↓
HTTPS
    ↓
Vercel
    ↓
MCP Server
    ↓
Odoo 17
```

The same MCP application can be tested locally before deployment.

------------------------------------------------------------------------

# 26. Testing Strategy

Testing should occur at several levels.

## MCP protocol test

Verify:

``` text
Initialize
List tools
Call tool
Receive result
```

## Tool unit tests

Test:

``` text
Input
 ↓
Validation
 ↓
Tool logic
 ↓
Expected output
```

## Odoo integration tests

Verify that the MCP tool retrieves the expected information from Odoo.

## Report tests

Verify:

``` text
MCP request
 ↓
Fixed resolver
 ↓
Tool Executor
 ↓
Odoo
 ↓
Generated file
```

Then actually open/read generated Excel/PDF files.

Do not consider HTTP 200 alone sufficient proof that a report is
correct.

------------------------------------------------------------------------

# 27. Recommended Build Order

Use this exact progression:

``` text
01. GitHub repository
        ↓
02. Vercel project
        ↓
03. Next.js application
        ↓
04. MCP endpoint
        ↓
05. hello() tool
        ↓
06. MCP Inspector
        ↓
07. More test tools
        ↓
08. MCP tool structure
        ↓
09. Odoo client
        ↓
10. Odoo authentication
        ↓
11. First read-only Odoo tool
        ↓
12. More Odoo tools
        ↓
13. Report tools
        ↓
14. Security/authentication
        ↓
15. Vercel production deployment
        ↓
16. Claude Pro remote MCP connection
        ↓
17. End-to-end testing
```

------------------------------------------------------------------------

# 28. Things We Are NOT Doing Yet

Do not start with:

``` text
❌ Claude integration
❌ Odoo write operations
❌ Arbitrary Odoo methods
❌ Direct PostgreSQL access
❌ Complex AI classification
❌ Multiple MCP servers
❌ Production credentials in GitHub
❌ Large tool catalog
```

First prove the smallest MCP server works.

------------------------------------------------------------------------

# 29. Final Target Architecture

The final target is:

``` text
                         ┌───────────────────┐
                         │     Claude Pro    │
                         │                   │
                         │ Natural Language  │
                         └─────────┬─────────┘
                                   │
                              MCP / HTTPS
                                   │
                                   ▼
                         ┌───────────────────┐
                         │      Vercel       │
                         │                   │
                         │   Next.js App     │
                         │                   │
                         │    MCP Server     │
                         │                   │
                         │ ┌───────────────┐ │
                         │ │ Customer Tools│ │
                         │ │ Sales Tools   │ │
                         │ │ Product Tools │ │
                         │ │ Report Tools  │ │
                         │ └───────┬───────┘ │
                         └─────────┼─────────┘
                                   │
                              Odoo API
                                   │
                                   ▼
                         ┌───────────────────┐
                         │      Odoo 17      │
                         │                   │
                         │ Business Data     │
                         │ Source of Truth   │
                         └───────────────────┘
```

For reporting:

``` text
Claude Pro
    ↓
MCP Report Tool
    ↓
Fixed Resolver
    ↓
Tool Executor
    ↓
Odoo 17
    ↓
Excel / PDF
```

This keeps the responsibilities separated:

``` text
Claude      = interface / reasoning
MCP         = protocol
MCP Server  = controlled tool bridge
Vercel      = hosting/runtime
Odoo        = authoritative business data
Reports     = controlled backend execution
GitHub      = source-code repository
```

# 30. First Milestone

The first milestone is intentionally small:

``` text
GitHub
   ↓
Vercel
   ↓
Next.js
   ↓
MCP Server
   ↓
hello()
   ↓
MCP Inspector
   ↓
SUCCESS
```

Only after this milestone is working should Odoo be introduced.

------------------------------------------------------------------------

## Key Principle

> **MCP is the controlled middle layer between Claude Pro and Odoo 17.**

It does not replace Odoo.

It does not become a second business database.

It does not calculate authoritative business figures.

It exposes controlled tools that allow Claude to request approved
operations against Odoo.

The ultimate goal is:

``` text
Claude Pro
     ↕
MCP Server
     ↕
Odoo 17
```

with **Odoo 17 remaining the authoritative source for Odoo business
information and report figures.**
