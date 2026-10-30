export interface iDocsTemplate {
    config: any
    files: Record<string, string>
}

// A short guide to the docs site itself. The user writes over it. The text is in English on purpose.
export function buildDocsTemplate(title: string): iDocsTemplate {
    return {
        config: {
            title,
            logo: true,
            dense: false,
            menu: true,
            content: [
                {
                    label: 'Getting started',
                    path: '/getting-started/index.md',
                    content: [
                        { label: 'Write a page', path: '/getting-started/write.md' },
                        { label: 'Organize the menu', path: '/getting-started/menu.md' }
                    ]
                }
            ]
        },
        files: {
            'index.md': `# ${title || 'Documentation'}

Welcome to the documentation of this project.

Replace this text with your own.
`,
            'getting-started/index.md': `# Getting started

This is a section with its own page. A section can have a page and pages below it, or only the pages below it.

- **Write a page** shows the Markdown you need most.
- **Organize the menu** shows how to build the menu and who sees what.
`,
            'getting-started/write.md': `# Write a page

Pages are written in Markdown. Use the toolbar above the editor or type the marks yourself.

## Text

You can write **bold**, *italic* and \`code\`. A link looks like [this](https://www.knowage-suite.com).

## Lists and tables

- First item
- Second item

| Name | Value |
|------|-------|
| One  | 1     |
| Two  | 2     |

## Images

Use the image button of the toolbar, or paste a picture into the editor. The picture is uploaded to the \`images\` folder and a line like \`![name](images/name.png)\` is added.

## Diagrams

\`\`\`mermaid
graph LR
    A[Write] --> B[Preview]
    B --> C[Save]
\`\`\`
`,
            'getting-started/menu.md': `# Organize the menu

The menu on the left of this page is the menu of your docs site.

- Drag a row by its handle to move it. Drop it on the middle of another row to put it inside.
- Use the "+" button of a row to add a page below it.
- Use the lock chips in the node settings to show a node only to some roles. A role that cannot see a section cannot see the pages below it.

Use **Preview as reader** to see the site as a role.
`
        }
    }
}
