/* The library — the public half of the AI engineering notes.
 *
 * The working notes are not on this site and should not be. They are long,
 * operational, and most useful while they are still messy. What is here is the
 * part that survives distillation: the principles, the sources they came from,
 * and the notes that are actually mine.
 *
 * Not to be confused with Playbook (github.com/josh2c/playbook), which is a
 * separate project. The source document calls itself a playbook; this does
 * not, so that the two names do not collide on one site.
 *
 * ---------------------------------------------------------------- schema ---
 *
 * There is ONE record type. The distinction between a source, a technique, a
 * recommendation, my notes and a workflow is carried by FIELDS, not by five
 * separate content types — which is what makes it impossible for the renderer
 * to present someone else's idea as mine. Every field has exactly one owner:
 *
 *   title, by, url    THE SOURCE      someone else's work. `by` is always
 *                                     printed wherever `lesson` is printed.
 *   lesson            THE TECHNIQUE   the idea extracted from that source,
 *                                     stated as theirs, never as mine.
 *   note              MY NOTES        my interpretation or disagreement. Only
 *                                     ever written by me. Usually empty.
 *   workflow          MY WORKFLOW     how I actually apply it.
 *   rec               RECOMMENDATION  why I think you should look at it.
 *
 * Cross-referencing is `topics` and `langs` — tags, not folders. One entry
 * appears under every topic and language it is tagged with, and there is only
 * ever one copy of it.
 *
 * `status` decides what the world sees. Promoting something is a one-word
 * edit; nothing has to be moved or restructured:
 *
 *   public     rendered everywhere
 *   queued     saved, not yet extracted. Renders ONLY under "Now", and only
 *              as a link with no claims attached — see reference-not-invention
 *   internal   mine, not ready. Never rendered.
 *   private    never rendered, never will be.
 *
 * To add a resource: append one record, tag it, set status. That is the whole
 * maintenance story.
 */

/* ------------------------------------------------------------ principles --- */

/* Distilled from the working notes. Each carries where it came from, and where
 * it came from someone else, `source` points at their entry — a principle I
 * adopted is not a principle I originated, and the page says so. */
const PRINCIPLES = [
    {
        id: 'intent-parity',
        title: 'Do not let AI silently resolve important ambiguity',
        body: 'Before implementation we should agree on what is being built, why, the expected behavior, the constraints, and what is out of scope. If a question can materially change architecture, behavior, security or the data model, it gets surfaced rather than guessed.',
        from: 'Human ↔ AI intent parity',
        topics: ['orchestration', 'requirements']
    },
    {
        id: 'confidence-is-a-diagnostic',
        title: 'Confidence is a diagnostic, not proof',
        body: 'Asking what the model knows, assumes, and is uncertain about is worth doing before a large run. The answer tells you where the rework will be. It does not tell you the code is correct.',
        from: 'Ask AI to expose uncertainty',
        topics: ['orchestration', 'audit']
    },
    {
        id: 'context-handoff',
        title: 'Do not make every new agent rediscover the same context',
        body: 'Moving work between agents means carrying the architecture, what was already investigated, what changed, what was tested, what failed, the decisions already made, and the open questions. Re-derivation is the most expensive thing in a multi-agent run.',
        from: 'Agent handoffs',
        topics: ['orchestration']
    },
    {
        id: 'measure-the-slop',
        title: 'Make AI slop measurable',
        body: 'Arguing about whether generated code is bad goes nowhere. Thresholds turn it into something you can point at: complexity, file length, dead code, surviving mutants, untyped escapes. They are signals for where to look rather than a standard to pass.',
        from: 'Code quality / AI slop audit',
        source: 'quentin-cody-slop',
        topics: ['audit', 'deslop', 'testing']
    },
    {
        id: 'complexity-ratchet',
        title: 'Stop the codebase getting worse while you reduce what is already there',
        body: 'Set the complexity ceiling at what the code actually is today, not where you wish it were. New complexity is blocked immediately; hotspots get simplified over time; the ceiling comes down as they do.',
        from: 'Complexity as a regression guard',
        source: 'hunk-complexity-ceiling',
        topics: ['complexity', 'audit', 'automation']
    },
    {
        id: 'data-structures-first',
        title: 'Read the data structures before the implementation',
        body: 'Bad data structures produce verbose, fragile code: every invalid state a structure permits becomes a conditional somewhere, and then the same conditional in many places. Reading the structures tells you most of what is wrong before you read a single function.',
        from: 'Data structures first',
        source: 'codeshaunted-data-structures',
        topics: ['audit', 'architecture', 'codebase-understanding']
    },
    {
        id: 'audit-only',
        title: 'An agent that is auditing must not also be modifying',
        body: 'Codebase-wide audits run read-only, in parallel, against a standardized prompt, with an orchestrator that validates, deduplicates and ranks what comes back. An agent allowed to fix what it finds stops reporting and starts rewriting.',
        from: 'Codebase-wide auditing',
        source: 'aaron-francis-audit',
        topics: ['audit', 'orchestration']
    },
    {
        id: 'smallest-change',
        title: 'Make the smallest change that produces the required behavior',
        body: 'Preserve the existing architecture and conventions while doing it. Most AI slop is unnecessary rather than wrong: extra wrappers, extra abstraction, extra configuration, all defensible line by line and indefensible as a whole.',
        from: 'Deslop',
        topics: ['deslop', 'refactoring']
    },
    {
        id: 'self-explanatory-code',
        title: 'Prefer making code clear over documenting why it is not',
        body: 'Documentation written only to explain confusing code is a recurring cost paid to avoid a one-time fix. Spend it on naming, control flow, types, data structures and smaller functions instead. This is not an argument against documentation. Why, architecture, business rules, constraints and operational knowledge all still have to be written down.',
        from: 'Self-explanatory code',
        source: 'matt-pocock-self-explanatory',
        topics: ['documentation', 'refactoring']
    },
    {
        id: 'reference-not-imitation',
        title: 'Reference an engineer, do not imitate one',
        body: '"Write this like Rob Pike would" produces pastiche. Pointing at the documented design philosophy of a language team, what they optimize for and why, gives the model something specific to reason against. The names are a bibliography rather than a costume.',
        from: 'Language-specific engineering',
        topics: ['languages']
    },
    {
        id: 'reference-not-invention',
        title: 'Do not invent techniques from titles',
        body: 'A saved link is a saved link. Until the actual content has been read and the technique extracted, there is nothing to teach and nothing to claim. A plausible summary generated from a headline is worse than an empty slot, because it looks like knowledge.',
        from: 'Cloud agents',
        topics: ['audit']
    },
    {
        id: 'examine-continuously',
        title: 'AI should not only write the software, it should continuously examine it',
        body: 'Writing code is one mode among many: explore, plan, build, debug, test, audit, deslop, secure, optimize, document, deploy, monitor. Treating generation as the whole job produces a system nobody understands, including the person who shipped it.',
        from: 'The meta-skill',
        topics: ['audit', 'orchestration']
    }
];

/* --------------------------------------------------------------- entries --- */

const ENTRIES = [
    {
        id: 'quentin-cody-slop',
        title: 'Quantitative AI slop audit',
        by: 'Quentin Cody',
        url: 'https://x.com/QuentinCody/status/2094127829419995613',
        kind: 'source',
        topics: ['audit', 'deslop', 'testing', 'complexity'],
        langs: [],
        lesson: 'Proposes measurable thresholds for generated code: cyclomatic and cognitive complexity under 22, Halstead difficulty under 80, under 500 lines per file, 100% test coverage, CRAP under 25, and zero surviving mutants, dead code, redundant code, or any/unknown escapes.',
        note: 'A bit overbearing, but it helps give clues about what we can add for testing. I treat these as audit signals rather than universal requirements. The point is that "this feels like slop" becomes something measurable.',
        rec: 'Worth reading even if you reject the numbers. It reframes an aesthetic complaint as an engineering one.',
        status: 'public',
        added: '2026-09'
    },
    {
        id: 'bentlegen-complexity',
        title: 'Complexity compounds: booleans versus constrained state',
        by: 'Bentlegen',
        url: 'https://x.com/bentlegen/status/2092614890116571436',
        kind: 'source',
        topics: ['audit', 'complexity', 'architecture'],
        langs: ['rust'],
        lesson: 'Three independent booleans describing one thing (held, sold, out_of_order) permit eight combinations, most of them invalid or contradictory, and every call site has to defend against them. One enum with four variants encodes only the states that can actually exist.',
        workflow: 'When I see three or more booleans traveling together through a function signature, that is the audit trigger. The question is what state machine they are impersonating.',
        status: 'public',
        added: '2026-09'
    },
    {
        id: 'codeshaunted-data-structures',
        title: 'Read the data structures first',
        by: 'Codeshaunted',
        url: 'https://x.com/codeshaunted/status/2090526260892205163',
        kind: 'source',
        topics: ['audit', 'architecture', 'codebase-understanding'],
        langs: [],
        lesson: '"Read the data structures, especially if you’re not reading any of the implementation code. Bad data structures lead to verbose and fragile code."',
        workflow: 'Before reviewing an implementation: identify the primary structures, their relationships, their invariants, which states are valid, which are impossible, what information is duplicated, and whether the shape is forcing conditionals that would not otherwise exist.',
        status: 'public',
        added: '2026-09'
    },
    {
        id: 'aaron-francis-audit',
        title: 'Read-only multi-agent codebase audit',
        by: 'Aaron Francis',
        url: 'https://x.com/aarondfrancis/status/2088285625946370352',
        url2: 'https://gist.github.com/aarondfrancis/8735edbe48532f97ee5ea818db4dbd47',
        url2Label: 'The audit prompt (gist)',
        kind: 'source',
        topics: ['audit', 'orchestration'],
        langs: [],
        lesson: 'A strong orchestrator inventories every subsystem, launches fresh read-only agents against each with one standardized prompt, then validates, deduplicates, groups and ranks the findings into a single report. The workers only read, gather evidence, and explain; they never modify.',
        workflow: 'This is the shape I use for anything codebase-wide. The orchestrator owns the inventory and the ranking; the workers own the evidence.',
        rec: 'The gist is the useful half. The prompt is the whole technique.',
        status: 'public',
        added: '2026-09'
    },
    {
        id: 'matt-pocock-self-explanatory',
        title: 'Self-explanatory code over explanatory docs',
        by: 'Matt Pocock',
        url: 'https://x.com/mattpocockuk/status/2076596585069174925',
        kind: 'source',
        topics: ['documentation', 'refactoring'],
        langs: ['typescript'],
        lesson: 'Delete documentation that exists only to explain confusing code, and spend the saved maintenance cost on making the code clear instead.',
        note: 'Easy to over-apply. It argues against docs that compensate for avoidable confusion, not against documentation itself. Why, architecture, business rules, external constraints, operational procedures and historical decisions all still need writing down.',
        status: 'public',
        added: '2026-09'
    },
    {
        id: 'hunk-complexity-ceiling',
        title: 'A complexity ceiling as a regression guard',
        by: 'Hunk, PR #861',
        url: 'https://github.com/modem-dev/hunk/pull/861',
        kind: 'project',
        topics: ['complexity', 'audit', 'automation'],
        langs: ['typescript'],
        lesson: 'The project added a lint rule capping cyclomatic complexity at 80, set deliberately at what the codebase already was rather than where they wanted it. It stops new complexity while hotspots get simplified, and the PR states the intention of lowering the ceiling over time.',
        rec: 'The interesting part is the honesty of the starting number. A ceiling set at the ideal fails on day one and gets disabled.',
        status: 'public',
        added: '2026-09'
    },
    {
        id: 'levelsio-security',
        title: 'Security checklist for shipped products',
        by: 'Levelsio',
        url: 'https://x.com/levelsio/status/2033547042396557421',
        kind: 'source',
        topics: ['security', 'cloud'],
        langs: [],
        lesson: 'A practical pass across secrets, database access, authentication, input validation, API surface, abuse and infrastructure. These are the categories that actually get exploited on small shipped products.',
        status: 'public',
        added: '2026-09'
    },
    {
        id: 'conductor-implementation-table',
        title: 'Implementation tables for large runs',
        kind: 'technique',
        topics: ['orchestration', 'requirements'],
        langs: [],
        lesson: 'Before a large run, require a table: feature, completion percentage, level of effort, the model’s confidence that it understands how to implement it, the questions needed to reach intent parity, and current status. An updated table at every checkpoint.',
        workflow: 'This is the single highest-leverage thing I do with a long agent run. The confidence column is where the rework hides, and the open-questions column is what stops architectural decisions being made silently.',
        status: 'public',
        added: '2026-09'
    },
    {
        id: 'call-path-debugging',
        title: 'Call-path-first debugging',
        kind: 'technique',
        topics: ['debugging', 'codebase-understanding'],
        langs: [],
        lesson: 'Before changing anything: map the entry point, the call path, the functions involved, the data flow, the database interactions, external services, side effects, the relevant types, and the tests that cover the behavior. Then form a hypothesis.',
        workflow: 'The instruction that matters is "do not modify code yet." Without it the model starts fixing at the first plausible cause, and you lose the map.',
        status: 'public',
        added: '2026-09'
    },

    /* Saved, not yet extracted. These render under Now and nowhere else, as
     * links with nothing claimed about them — see reference-not-invention. */
    {
        id: 'worktree-video',
        title: 'Git worktree setup for parallel agents',
        by: 'YouTube',
        url: 'https://www.youtube.com/watch?v=OpM-G3WNH4g',
        kind: 'source',
        topics: ['git', 'orchestration'],
        langs: [],
        status: 'queued',
        added: '2026-09'
    },
    {
        id: 'matt-pocock-cloud-agents',
        title: 'Cloud agents',
        by: 'Matt Pocock',
        url: 'https://x.com/mattpocockuk/status/2089592149385822686',
        kind: 'source',
        topics: ['cloud', 'orchestration'],
        langs: [],
        status: 'queued',
        added: '2026-09'
    },
    {
        id: 'addy-osmani-cloud-agents',
        title: 'Cloud agents',
        by: 'Addy Osmani',
        url: 'https://x.com/addyosmani/status/2089061176500158912',
        kind: 'source',
        topics: ['cloud', 'orchestration'],
        langs: [],
        status: 'queued',
        added: '2026-09'
    }
];

/* ------------------------------------------------------------- languages --- */

/* A language gets a page because there is something curated to put on it —
 * the engineers whose documented principles are worth pointing a model at,
 * what to point them at for, and the review prompt I actually use. A language
 * with only a name does not get a page. */
const LANGS = [
    {
        id: 'rust',
        name: 'Rust',
        philosophy: 'Make invalid states unrepresentable, and let the type system carry the invariants the code would otherwise defend at every call site.',
        engineers: [
            { name: 'Niko Matsakis', what: 'Language Team, Specification Team, Async Working Group, types' },
            { name: 'Tyler Mandry', what: 'Language Team lead, Async Working Group lead' },
            { name: 'Josh Triplett', what: 'Language Team, language design' },
            { name: 'Alice Ryhl', what: 'Language advisor, async ecosystem' }
        ],
        source: 'Grounded in the Rust project’s current team records.',
        sourceUrl: 'https://rust-lang.org/governance/teams/lang/',
        areas: ['Ownership', 'Borrowing', 'Lifetimes', 'Traits', 'Generics', 'Enums', 'Pattern matching', 'Type-driven design', 'Async', 'Concurrency', 'Error handling', 'Compiler behavior', 'State machines', 'Unsafe Rust'],
        prompt: 'Review this Rust code using idiomatic Rust and the principles associated with the Rust language team as reference points.\n\nPrioritize:\n- strong type-level invariants\n- explicit ownership\n- clear error handling\n- appropriate use of enums\n- appropriate trait design\n- simple abstractions\n- predictable concurrency\n\nExplain important ownership, lifetime, trait, and type-system decisions before implementing them.'
    },
    {
        id: 'typescript',
        name: 'TypeScript',
        philosophy: 'Types that make invalid states hard to represent, with real validation at the trust boundaries, and no type-level cleverness that does not pay for itself.',
        engineers: [
            { name: 'Anders Hejlsberg', what: 'TypeScript creator and language designer' },
            { name: 'Matt Pocock', what: 'Practical TypeScript, type-system usage, APIs' },
            { name: 'Josh Goldberg', what: 'TypeScript contributor and author' }
        ],
        areas: ['Type design', 'Generics', 'Narrowing', 'Discriminated unions', 'Type inference', 'API design', 'Runtime vs compile-time validation', 'Library design', 'any', 'Unsafe casts', 'Type-level programming'],
        prompt: 'Review this TypeScript using strong type-design principles.\n\nPrefer:\n- types that make invalid states difficult to represent\n- explicit runtime validation at trust boundaries\n- useful inference\n- minimal use of any\n- simple APIs\n- understandable types\n\nDo not introduce advanced type-level programming unless it materially improves the design.'
    },
    {
        id: 'python',
        name: 'Python',
        philosophy: 'Reach for the standard library and an established idiom before reaching for an abstraction or a dependency.',
        engineers: [
            { name: 'Guido van Rossum', what: 'Python creator' },
            { name: 'Raymond Hettinger', what: 'Core contributor, standard library' },
            { name: 'Tim Peters', what: 'Core contributor, author of the Zen of Python' },
            { name: 'Hynek Schlawack', what: 'Production Python, packaging, maintainability' }
        ],
        areas: ['Pythonic design', 'Standard library', 'Iterators', 'Generators', 'Data structures', 'Readability', 'API design', 'Packaging', 'Testing', 'Production Python'],
        prompt: 'Review this as production Python.\n\nPrefer Python’s established idioms and standard library before introducing new abstractions or dependencies.\n\nFavor:\n- readability\n- straightforward data structures\n- explicit behavior\n- maintainable APIs\n- simple control flow'
    },
    {
        id: 'go',
        name: 'Go',
        philosophy: 'Simplicity is the feature. Most of the review is finding the abstraction that should not be there.',
        engineers: [
            { name: 'Rob Pike', what: 'Co-creator, design philosophy' },
            { name: 'Russ Cox', what: 'Technical leadership, language evolution' },
            { name: 'Robert Griesemer', what: 'Co-creator, language and compiler' },
            { name: 'Ken Thompson', what: 'Co-creator, systems engineering' }
        ],
        source: 'Go’s own history identifies these engineers as the language’s originators.',
        sourceUrl: 'https://go.dev/blog/toward-go2',
        areas: ['Simplicity', 'Interfaces', 'Concurrency', 'Goroutines', 'Channels', 'Error handling', 'Package design', 'Standard library', 'Systems programming'],
        prompt: 'Review this Go code using the design philosophy of the Go project as a reference.\n\nLook for:\n- unnecessary abstraction\n- overly complicated interfaces\n- unnecessary dependencies\n- concurrency mistakes\n- unclear package boundaries\n- opportunities to simplify\n\nPrefer simple, explicit designs.'
    },
    {
        id: 'sql',
        name: 'SQL / PostgreSQL',
        philosophy: 'Do not optimize on intuition. Decide what should be measured, then measure it.',
        engineers: [
            { name: 'Andres Freund', what: 'Performance, scalability, JIT, replication, storage' },
            { name: 'Tom Lane', what: 'Core contributor, query optimizer' },
            { name: 'Peter Eisentraut', what: 'Core development, build systems, documentation' },
            { name: 'Peter Geoghegan', what: 'B-tree internals, sorting performance, amcheck' },
            { name: 'Robert Haas', what: 'Core contributor, database internals' }
        ],
        source: 'From the PostgreSQL project’s contributor records.',
        sourceUrl: 'https://www.postgresql.org/community/contributors/',
        areas: ['Query planning', 'Indexes', 'Transactions', 'MVCC', 'Locks', 'Concurrency', 'Query optimization', 'Data modeling', 'Internals', 'RLS', 'Replication', 'Performance', 'Data integrity'],
        prompt: 'Review this PostgreSQL design using PostgreSQL core-development principles as the reference.\n\nInspect:\n- query plans\n- indexes\n- cardinality assumptions\n- joins\n- transactions\n- locking\n- concurrency\n- data integrity\n- RLS\n- PostgreSQL-specific behavior\n\nDo not optimize based only on intuition. Identify what should be measured or inspected.'
    },
    {
        id: 'cpp',
        name: 'C++',
        philosophy: 'Zero-cost abstraction is a claim to be checked, not a slogan.',
        engineers: [
            { name: 'Bjarne Stroustrup', what: 'C++ designer' },
            { name: 'Herb Sutter', what: 'Language and standards' },
            { name: 'Chandler Carruth', what: 'Compilers, performance, large-scale systems' },
            { name: 'Andrei Alexandrescu', what: 'Generic programming, template design' }
        ],
        areas: ['RAII', 'Templates', 'Generic programming', 'Memory', 'Concurrency', 'Performance', 'Zero-cost abstractions', 'API design', 'Compile-time programming']
    },
    {
        id: 'java',
        name: 'Java',
        philosophy: 'API design is the long-lived decision; everything else can be refactored later.',
        engineers: [
            { name: 'Brian Goetz', what: 'Java language architect' },
            { name: 'Joshua Bloch', what: 'API and platform, author of Effective Java' },
            { name: 'James Gosling', what: 'Java creator' }
        ],
        areas: ['API design', 'Collections', 'Generics', 'JVM', 'Concurrency', 'Language evolution', 'Library design', 'Performance']
    },
    {
        id: 'kotlin',
        name: 'Kotlin',
        philosophy: 'Structured concurrency, and no mechanical reproduction of Java patterns where Kotlin has a better one.',
        engineers: [
            { name: 'Roman Elizarov', what: 'Project leadership, coroutines, language and runtime design' }
        ],
        areas: ['Coroutines', 'Structured concurrency', 'Type system', 'JVM interoperability', 'Async programming', 'API design'],
        prompt: 'Review this Kotlin using idiomatic Kotlin and the design principles associated with the Kotlin language ecosystem.\n\nPrefer:\n- structured concurrency\n- expressive types\n- clear APIs\n- Kotlin-native patterns\n\nDo not mechanically reproduce Java patterns where Kotlin provides a better abstraction.'
    },
    {
        id: 'swift',
        name: 'Swift',
        philosophy: 'Value semantics first; reach for reference types when you actually need identity.',
        engineers: [
            { name: 'John McCall', what: 'Language evolution, compiler' },
            { name: 'Joe Groff', what: 'Language evolution, type system' },
            { name: 'Doug Gregor', what: 'Compiler, generics' },
            { name: 'Holly Borla', what: 'Concurrency, type system' }
        ],
        areas: ['Value semantics', 'Protocols', 'Generics', 'Actors', 'Concurrency', 'Memory', 'Compiler behavior', 'API design']
    },
    {
        id: 'shell',
        name: 'Bash / Shell',
        philosophy: 'No single personality to reference here. Use the Unix, POSIX and Bash ecosystem, and know when to stop.',
        engineers: [],
        areas: ['Quoting', 'Exit codes', 'Robust scripting', 'Standard tools', 'ShellCheck'],
        rules: [
            'Quote variables',
            'Check exit codes',
            'Avoid fragile text parsing',
            'Avoid unnecessary shell complexity',
            'Prefer standard tools',
            'Use ShellCheck',
            'Move to a real language once the script gets complicated'
        ]
    }
];

/* ------------------------------------------------------------- practices --- */

/* The distilled workflows — one per topic, and only where the notes have
 * something worth stating in public. This is the layer that makes a topic page
 * worth landing on: not a list of links, but how I actually work the problem.
 *
 * `flow` is the sequence. `checks` is what to look at. `rule` is the one line
 * that matters most. Everything here is mine unless a principle on the same
 * page credits somebody else.
 */
const PRACTICES = [
    {
        topic: 'codebase-understanding',
        intro: 'Map unfamiliar code before you change it. The map is the point, and the line that matters is "do not modify anything yet". Without it the model starts editing at the first thing that looks wrong and you never get the map.',
        flow: ['User action', 'UI', 'Event handler', 'API', 'Business logic', 'Database', 'Response', 'UI state'],
        checks: ['Entry point', 'Call path', 'Functions involved', 'Data flow', 'Database interactions', 'External services', 'Side effects', 'Relevant types', 'Tests covering the behavior'],
        rule: 'Where does data enter, where does it change, who owns the behavior, and where do the side effects happen?',
        prompt: 'Before modifying anything, map the relevant part of the codebase.\n\nIdentify:\n\n- entry point\n- call path\n- functions involved\n- data flow\n- database interactions\n- external services\n- side effects\n- relevant types/interfaces\n- tests covering the behavior\n\nDo not modify code yet.'
    },
    {
        topic: 'debugging',
        intro: 'Follow the call path first. The error you can see usually is not the cause, and walking the path is the quickest way to find that out.',
        flow: ['Reproduce', 'Trace call path', 'Identify ownership', 'Explain behavior', 'Form hypothesis', 'Predict it yourself', 'Test the hypothesis', 'Fix', 'Regression test'],
        checks: ['What receives the input?', 'What transforms it?', 'Where does state change?', 'Where does the failure first appear?', 'What owns the behavior?', 'What assumptions are being violated?', 'Is the visible error actually the root cause?'],
        rule: 'Predict the problem yourself before the model proposes a fix. If you cannot, you do not understand it yet.',
        prompt: 'Before touching anything, walk me through the call path involved in this bug.\n\nShow me which functions own what behavior.\n\nExplain the relevant language constructs.\n\nThen let me predict the problem before you propose a fix.'
    },
    {
        topic: 'testing',
        intro: 'Coverage tells you the line ran. Mutation testing tells you the suite would have noticed if the line were wrong. On generated code only the second one is worth much.',
        flow: ['Implementation', 'Tests', 'Mutation testing', 'Surviving mutants', 'Identify missing assertions', 'Improve tests', 'Run mutation testing again'],
        checks: ['Coverage', 'Missing branches', 'Missing edge cases', 'Weak assertions', 'Duplicate tests', 'Error paths', 'Integration boundaries', 'Regression coverage'],
        rule: 'A test suite should demonstrate that it can detect meaningful changes in behavior, not merely execute lines of code.'
    },
    {
        topic: 'audit',
        intro: 'Run it read-only and in parallel, with one orchestrator keeping the inventory and doing the ranking. The moment an agent can fix what it finds, it stops telling you about it.',
        flow: ['Inventory every subsystem', 'Launch fresh read-only agents', 'One standardized prompt', 'Validate findings', 'Deduplicate', 'Rank opportunities', 'Audit report'],
        rule: 'Audit only. Never let the agents modify the codebase in the same pass.'
    },
    {
        topic: 'deslop',
        intro: 'Most AI slop is not wrong, it is just unnecessary. Each piece looks fine on its own line and the whole thing is a mess.',
        checks: ['Excessive complexity', 'Dead code', 'Redundant code', 'Duplicate logic', 'Unnecessary abstractions', 'Excessive wrappers', 'Giant functions', 'Giant files', 'Excessive conditionals', 'Weak typing', 'any / unknown', 'Repeated validation', 'AI boilerplate', 'Unused configuration', 'Code that does not match repository conventions'],
        flow: ['Identify suspicious code', 'Explain why', 'Provide evidence', 'Decide whether the complexity is justified', 'Propose simplification', 'Get approval if architectural', 'Implement', 'Test'],
        rule: 'Make the smallest change that produces the required behavior while preserving existing architecture and conventions.'
    },
    {
        topic: 'complexity',
        intro: 'Worth checking on its own, separately from whether the code works. It usually does work. The question is what it will cost to change next time.',
        checks: ['Large decision trees', 'Nested conditionals', 'Repeated guards', 'Boolean combinations', 'Large switch or match statements', 'State-transition logic', 'Dispatchers doing too much'],
        prompt: 'Identify the highest-complexity functions in this codebase.\n\nFor each:\n\n- calculate/inspect complexity\n- explain why it is complex\n- identify the decision paths\n- determine whether the complexity is justified\n- identify simplification opportunities\n- identify missing tests'
    },
    {
        topic: 'security',
        intro: 'Go in this order, because the expensive stuff sits near the front. Write findings into a table: severity, finding, attack scenario, affected code, fix, how you verified it. If you cannot write the attack scenario, it is not a finding.',
        flow: ['Secrets', 'Authentication', 'Authorization', 'Database / RLS', 'Input validation', 'API exposure', 'Sessions', 'File uploads', 'Rate limiting', 'Security headers', 'Dependencies', 'Infrastructure'],
        table: {
            caption: 'Finding format',
            head: ['Severity', 'Finding', 'Attack scenario', 'Affected code', 'Fix', 'Verification'],
            rows: [],
            note: 'The attack scenario column is the filter. A finding that cannot be written as a scenario is a preference, and it does not belong in the report.'
        },
        checks: ['Keys hidden, secrets purged from git, environment and logs and client bundles inspected', 'Only the public database key exposed, RLS enabled and its policies verified', 'Server-side auth enforced, sessions secure, authorization verified separately from authentication', 'Queries parameterized, input validated, user content escaped, uploads restricted', 'API responses trimmed, sensitive endpoints rate limited', 'Login rate limiting, bot and brute-force protection', 'HTTPS, security headers, dependency scanning, network exposure review']
    },
    {
        topic: 'performance',
        intro: 'The discipline is not acting on a hunch. Every step is there to make sure something got measured before and after.',
        flow: ['Measure', 'Find the bottleneck', 'Explain the bottleneck', 'Propose a change', 'Implement', 'Measure again'],
        checks: ['N+1 queries', 'Sequential requests', 'Waterfalls', 'Missing indexes', 'Large payloads', 'Slow APIs', 'Rendering', 'Bundle size', 'Caching', 'Memory', 'CPU'],
        rule: 'Measure before optimizing.'
    },
    {
        topic: 'database',
        intro: 'Start at the schema. Most query problems are schema problems that someone keeps paying for instead of fixing.',
        flow: ['Schema', 'Relationships', 'Constraints', 'Queries', 'Indexes', 'RLS', 'Transactions', 'Performance', 'Migration safety']
    },
    {
        topic: 'architecture',
        intro: 'Lay out the options and what each one costs. An architecture picked without a stated tradeoff is a decision nobody actually made.',
        checks: ['Viable approaches', 'Tradeoffs of each', 'Failure modes', 'Operational complexity', 'Assumptions', 'What needs to be measured or validated'],
        rule: 'Do not silently choose an architecture when a material tradeoff requires a human decision.',
        prompt: 'Given these requirements and constraints:\n\n1. Identify the viable architectural approaches.\n2. Explain the tradeoffs of each.\n3. Identify failure modes.\n4. Identify operational complexity.\n5. Identify assumptions.\n6. Identify what needs to be measured or validated.\n\nDo not silently choose an architecture when a material tradeoff requires a human decision.'
    },
    {
        topic: 'review',
        intro: 'Go in this order. A correctness bug and a naming preference are not the same kind of finding and should not end up in the same list.',
        flow: ['Correctness', 'Security', 'Data integrity', 'Performance', 'Maintainability', 'Type safety', 'Error handling', 'Tests', 'Regression risk', 'Repository consistency'],
        rule: 'Do not report stylistic preferences as defects.'
    },
    {
        topic: 'refactoring',
        intro: 'This one has a hard rule attached, and it is the rule an agent is most likely to break quietly.',
        checks: ['Simplify control flow', 'Remove duplication', 'Remove dead code', 'Improve types', 'Split large functions', 'Simplify abstractions', 'Improve naming', 'Improve data structures'],
        rule: 'Behavior must remain unchanged unless a behavior change was explicitly requested.'
    },
    {
        topic: 'documentation',
        intro: 'Docs carry what the code cannot: why it works this way, the business rules, the outside constraints, and decisions you can no longer see in the source.',
        checks: ['README', 'Architecture docs', 'API docs', 'Database docs', 'Setup instructions', 'Deployment docs', 'Runbooks', 'Troubleshooting', 'ADRs', 'Security docs', 'Contributing guides'],
        rule: 'Write it in Simplified Technical English, document actual behavior, and do not let it sound generated.'
    },
    {
        topic: 'git',
        intro: 'One worktree per agent. Running several at once stops being scary once they cannot touch each other\u2019s files.',
        checks: ['Parallel work', 'Isolated changes', 'Lower collision risk', 'Easier review', 'Easier rollback', 'Independent experiments']
    },
    {
        topic: 'requirements',
        intro: 'The cheapest place to catch an ambiguity is before it becomes an architecture.',
        flow: ['Problem', 'Requirement', 'Acceptance criteria', 'Architecture', 'Implementation', 'Tests'],
        checks: ['Ambiguous requirements', 'Missing edge cases', 'Conflicting requirements', 'Roles', 'Permissions', 'Business rules', 'State transitions', 'Acceptance criteria']
    },
    {
        topic: 'observability',
        intro: 'It is worth whatever it can answer. If the logs, metrics, traces and deploy history cannot answer these six questions, they are decoration.',
        checks: ['What happened?', 'When did it start?', 'What changed?', 'Why did it happen?', 'What was affected?', 'How do we know the fix worked?']
    },
    {
        topic: 'incident',
        intro: 'Contain it before you investigate. The timeline is what makes it something you can learn from afterwards.',
        flow: ['Detect', 'Contain', 'Investigate', 'Establish timeline', 'Identify root cause', 'Fix', 'Verify', 'Document']
    },
    {
        topic: 'release',
        intro: 'A sequence with a way back out. People skip the last step.',
        flow: ['Audit', 'Test', 'Build', 'Deploy', 'Smoke test', 'Monitor', 'Verify', 'Roll back if required']
    },
    {
        topic: 'orchestration',
        intro: 'Big runs get a table before any code. The confidence column is where the rework hides. The open questions column is what stops decisions getting made without me.',
        flow: ['Understand requirements', 'Inventory relevant code', 'Identify dependencies', 'Create implementation table', 'Identify uncertainty', 'Resolve important questions', 'Define acceptance criteria', 'Implement', 'Test', 'Audit', 'Report progress', 'Update the table'],
        checks: ['Feature or part', 'Completion percentage', 'Level of effort', 'Model confidence it understands the implementation', 'Questions needed for intent parity', 'Current status'],
        rule: 'An updated implementation table at every progress or stop point.',
        table: {
            caption: 'The implementation table',
            head: ['Feature / part', '% complete', 'LOE', 'AI confidence', 'Open questions', 'Status'],
            rows: [
                ['Authentication', '0%', 'M', '90%', '\u2014', 'Not started'],
                ['Dashboard', '50%', 'L', '70%', 'Data requirements?', 'Blocked']
            ],
            note: 'The confidence column is the one that earns its place. A feature at 50% with 70% confidence is a different problem from one at 50% with 95%, and only one of them needs a conversation before the next run.'
        },
        prompt: 'Before beginning this implementation run, create an implementation table with:\n\n- feature/part name\n- current completion percentage\n- estimated LOE\n- your confidence that you understand how to implement it\n- questions required to establish human-AI intent parity\n- current status\n\nIdentify ambiguities before implementation.\n\nAt every progress or stop point, provide an updated implementation table.\n\nDo not silently make architectural or product decisions that materially affect the implementation.'
    },
    {
        topic: 'cloud',
        intro: 'What I expect an agent to know before it goes near a box that serves traffic.',
        checks: ['Linux', 'SSH', 'Users and groups', 'Firewall', 'Docker', 'Docker Compose', 'Reverse proxy', 'Nginx', 'Caddy', 'SSL', 'DNS', 'Backups', 'Monitoring', 'Logs', 'Resource management', 'Database hosting', 'Deployment', 'Recovery']
    }
];

/* ----------------------------------------------------------------- areas --- */

/* The areas of the work where AI is worth pointing at something, in roughly
 * the order you meet them. Not a loop or a process: nobody runs these in
 * sequence. It is a way of finding the right shelf, replacing a flat list of
 * twenty-one topics sorted by how many entries each happened to have.
 *
 * These are the pages. A topic is a section inside one, not a destination of
 * its own: seven of the twenty-one had no sources and no principles behind
 * them, so clicking one bought a heading and a list of nouns. An area collects
 * enough to be worth landing on.
 *
 * `languages` is deliberately absent. It is not an area of the work, it sits
 * under all of them, so it keeps its own block on the page.
 */
const AREAS = [
    { id: 'plan', name: 'Intent & plan',
      intro: 'Working out what is being built before anyone builds it, and keeping a long run from drifting.',
      topics: ['requirements', 'architecture', 'orchestration'] },

    { id: 'understand', name: 'Understand',
      intro: 'Reading the code before you touch it.',
      topics: ['codebase-understanding'] },

    { id: 'build', name: 'Build',
      intro: 'Changing code, plus the two things that cause the most trouble while you do.',
      topics: ['refactoring', 'git', 'database'] },

    { id: 'debug', name: 'Debug',
      intro: 'Finding the real cause instead of the first one that looks right.',
      topics: ['debugging'] },

    { id: 'test', name: 'Test',
      intro: 'Checking the tests would actually catch a change in behavior.',
      topics: ['testing'] },

    { id: 'audit', name: 'Audit',
      intro: 'Finding problems. Fixing them is a different job.',
      topics: ['audit', 'complexity', 'deslop', 'review'] },

    { id: 'secure', name: 'Secure',
      intro: 'The pass that catches what actually gets exploited on small products.',
      topics: ['security'] },

    { id: 'optimize', name: 'Optimize',
      intro: 'Measure, change one thing, measure again.',
      topics: ['performance'] },

    { id: 'document', name: 'Document',
      intro: 'Writing down what the code cannot tell you itself.',
      topics: ['documentation'] },

    { id: 'ship', name: 'Ship & run',
      intro: 'Getting it out, watching it, and being able to go back.',
      topics: ['release', 'cloud', 'automation', 'observability', 'incident'] }
];

/* ---------------------------------------------------------------- topics --- */

/* Labels only. Which topics exist at all is derived from the entries, so a
 * topic cannot outlive its content. */
const TOPIC_NAMES = {
    'orchestration': 'Agent orchestration',
    'codebase-understanding': 'Codebase understanding',
    'debugging': 'Debugging',
    'audit': 'Auditing',
    'complexity': 'Complexity',
    'deslop': 'Deslop',
    'testing': 'Testing',
    'security': 'Security',
    'documentation': 'Documentation',
    'refactoring': 'Refactoring',
    'architecture': 'Architecture',
    'git': 'Git',
    'cloud': 'Cloud & agents',
    'automation': 'Automation',
    'requirements': 'Requirements',
    'languages': 'Languages',
    'review': 'Code review',
    'observability': 'Observability',
    'incident': 'Incident response',
    'release': 'Release',
    'performance': 'Performance',
    'database': 'Databases'
};

window.jgLibrary = { PRINCIPLES, ENTRIES, LANGS, PRACTICES, AREAS, TOPIC_NAMES };
