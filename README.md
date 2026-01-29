# Bull-Connect CRM

Bull-Connect CRM is an internal, state-machine-driven system for managing farmer acquisition workflows.

This repository follows a database-first, workflow-first architecture.

## Phase 1 Scope
- Strict lead state machine
- Telecalling → Field verification flow
- PostgreSQL as source of truth
- No farmer-facing access

## Core Principle
State transitions are explicit, sequential, and enforced.

UI and analytics are secondary to correctness.