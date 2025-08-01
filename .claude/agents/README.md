# WAOK QA Management System - Specialized Subagents

This directory contains specialized AI subagents designed to accelerate development and maintenance of the WAOK QA Management System. Each subagent has specific expertise and will be automatically invoked by Claude Code when relevant tasks are detected.

## Available Subagents

### 1. supabase-migration-expert
**Purpose**: Database schema design and migration management
**When to use**: 
- Creating new database tables
- Modifying existing schema
- Writing SQL migrations
- Optimizing database performance

**Key capabilities**:
- PostgreSQL expertise
- Migration best practices
- Performance optimization
- Data integrity management

### 2. qa-feature-builder
**Purpose**: Rapid development of QA tracking features
**When to use**:
- Building new QA functionality
- Creating verification workflows
- Adding team management features
- Implementing reporting capabilities

**Key capabilities**:
- React/TypeScript development
- Component creation following patterns
- Supabase real-time integration
- State management with Context API

### 3. i18n-translator
**Purpose**: Internationalization and translation management
**When to use**:
- Adding new user-facing text
- Updating translations
- Ensuring language consistency
- Managing translation keys

**Key capabilities**:
- English/Spanish translation
- i18next configuration
- QA terminology consistency
- Translation key management

### 4. ui-component-creator
**Purpose**: Building consistent UI components with Tailwind CSS
**When to use**:
- Creating new UI components
- Building modals and forms
- Improving user interfaces
- Ensuring design consistency

**Key capabilities**:
- Tailwind CSS expertise
- Responsive design
- Accessibility compliance
- Animation and transitions

### 5. test-automation-specialist
**Purpose**: Setting up and maintaining test suites
**When to use**:
- Implementing testing infrastructure
- Writing unit tests
- Creating integration tests
- Setting up E2E tests

**Key capabilities**:
- Vitest/Jest configuration
- React Testing Library
- Test coverage optimization
- CI/CD integration

### 6. netlify-deploy-manager
**Purpose**: Netlify deployment and serverless function management
**When to use**:
- Deploying to Netlify
- Creating serverless functions
- Optimizing build performance
- Managing environment variables

**Key capabilities**:
- Netlify configuration
- Serverless function development
- Build optimization
- Edge function implementation

### 7. qa-test-architect
**Purpose**: Comprehensive testing strategy design
**When to use**:
- Designing test architectures
- Creating testing strategies
- Implementing quality metrics
- Planning test automation

**Key capabilities**:
- Test pyramid design
- Quality KPI definition
- Accessibility testing
- Performance benchmarking

### 8. test-agent
**Purpose**: Simple agent for testing subagent functionality
**When to use**:
- Verifying subagent system works
- Testing tool access
- Debugging agent issues

**Key capabilities**:
- Basic functionality verification
- Tool access testing
- Context isolation confirmation

### 9. todo-list-specialist
**Purpose**: Advanced task management and workflow automation
**When to use**:
- Building task management features
- Creating workflow automation
- Implementing task dependencies
- Adding productivity analytics

**Key capabilities**:
- Task board development
- Workflow automation rules
- Reminder systems
- Productivity metrics

## Usage

These subagents will be automatically invoked by Claude Code when it detects relevant tasks. You can also explicitly request a specific subagent:

```
Use the qa-feature-builder subagent to create a new reporting dashboard
```

```
Have the supabase-migration-expert create a migration for user management
```

## Benefits

1. **Faster Development**: Specialized knowledge for rapid implementation
2. **Consistency**: Following established patterns and conventions
3. **Quality**: Built-in best practices for each domain
4. **Context Preservation**: Each subagent maintains its own focused context

## Maintenance

To modify a subagent:
1. Edit the corresponding `.md` file in this directory
2. Update the `description` field to change when it's invoked
3. Modify the `tools` field to change available permissions
4. Edit the system prompt to adjust behavior

## Best Practices

- Let subagents work autonomously when triggered
- Provide clear requirements when explicitly invoking
- Review subagent outputs for consistency with project standards
- Update subagents as project patterns evolve