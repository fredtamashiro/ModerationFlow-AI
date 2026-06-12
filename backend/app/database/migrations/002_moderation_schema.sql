CREATE SCHEMA IF NOT EXISTS moderation;

CREATE TABLE IF NOT EXISTS moderation.comments (
    id UUID PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255),
    lesson_name VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT moderation_comments_status_check
        CHECK (
            status IN (
                'pending',
                'analyzing',
                'waiting_human_review',
                'approved',
                'removed',
                'edit_requested',
                'failed'
            )
        )
);

CREATE TABLE IF NOT EXISTS moderation.guidelines (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    examples JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT moderation_guidelines_severity_check
        CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE TABLE IF NOT EXISTS moderation.moderation_runs (
    id UUID PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES moderation.comments(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    route VARCHAR(100),
    risk_level VARCHAR(50),
    category VARCHAR(100),
    confidence NUMERIC(5,4),
    recommended_action VARCHAR(50),
    ai_justification TEXT,
    critic_applied BOOLEAN NOT NULL DEFAULT FALSE,
    requires_human_review BOOLEAN NOT NULL DEFAULT TRUE,
    policy_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT moderation_runs_status_check
        CHECK (
            status IN (
                'started',
                'completed',
                'failed',
                'waiting_human_review'
            )
        ),
    CONSTRAINT moderation_runs_route_check
        CHECK (
            route IS NULL
            OR route IN (
                'spam_fast_path',
                'toxic_fast_path',
                'low_risk_path',
                'ambiguous_deep_review',
                'fallback_human_review'
            )
        ),
    CONSTRAINT moderation_runs_risk_level_check
        CHECK (
            risk_level IS NULL
            OR risk_level IN ('low', 'medium', 'high', 'unknown')
        ),
    CONSTRAINT moderation_runs_recommended_action_check
        CHECK (
            recommended_action IS NULL
            OR recommended_action IN (
                'approve',
                'flag',
                'remove',
                'request_edit',
                'needs_human_review'
            )
        ),
    CONSTRAINT moderation_runs_confidence_check
        CHECK (
            confidence IS NULL
            OR (confidence >= 0 AND confidence <= 1)
        )
);

CREATE TABLE IF NOT EXISTS moderation.moderation_steps (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES moderation.moderation_runs(id) ON DELETE CASCADE,
    node_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    duration_ms INTEGER,
    model VARCHAR(100),
    input_tokens INTEGER,
    output_tokens INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT moderation_steps_status_check
        CHECK (status IN ('started', 'completed', 'failed', 'skipped'))
);

CREATE TABLE IF NOT EXISTS moderation.moderation_decisions (
    id UUID PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES moderation.comments(id) ON DELETE CASCADE,
    run_id UUID REFERENCES moderation.moderation_runs(id) ON DELETE SET NULL,
    ai_recommendation VARCHAR(50),
    human_decision VARCHAR(50) NOT NULL,
    human_category VARCHAR(100),
    human_risk_level VARCHAR(50),
    moderator_note TEXT,
    final_content TEXT,
    was_ai_correct BOOLEAN,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT moderation_decisions_human_decision_check
        CHECK (human_decision IN ('approve', 'flag', 'remove', 'request_edit')),
    CONSTRAINT moderation_decisions_ai_recommendation_check
        CHECK (
            ai_recommendation IS NULL
            OR ai_recommendation IN (
                'approve',
                'flag',
                'remove',
                'request_edit',
                'needs_human_review'
            )
        ),
    CONSTRAINT moderation_decisions_human_risk_level_check
        CHECK (
            human_risk_level IS NULL
            OR human_risk_level IN ('low', 'medium', 'high', 'unknown')
        )
);

CREATE TABLE IF NOT EXISTS moderation.feedback_examples (
    id UUID PRIMARY KEY,
    comment_text TEXT NOT NULL,
    ai_decision VARCHAR(50),
    human_decision VARCHAR(50) NOT NULL,
    ai_category VARCHAR(100),
    human_category VARCHAR(100),
    ai_confidence NUMERIC(5,4),
    moderator_note TEXT,
    was_ai_correct BOOLEAN,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT feedback_examples_human_decision_check
        CHECK (human_decision IN ('approve', 'flag', 'remove', 'request_edit')),
    CONSTRAINT feedback_examples_ai_decision_check
        CHECK (
            ai_decision IS NULL
            OR ai_decision IN (
                'approve',
                'flag',
                'remove',
                'request_edit',
                'needs_human_review'
            )
        ),
    CONSTRAINT feedback_examples_ai_confidence_check
        CHECK (
            ai_confidence IS NULL
            OR (ai_confidence >= 0 AND ai_confidence <= 1)
        )
);

CREATE INDEX IF NOT EXISTS moderation_comments_status_idx
ON moderation.comments (status);

CREATE INDEX IF NOT EXISTS moderation_comments_created_at_idx
ON moderation.comments (created_at);

CREATE INDEX IF NOT EXISTS moderation_runs_comment_id_idx
ON moderation.moderation_runs (comment_id);

CREATE INDEX IF NOT EXISTS moderation_runs_status_idx
ON moderation.moderation_runs (status);

CREATE INDEX IF NOT EXISTS moderation_runs_created_at_idx
ON moderation.moderation_runs (created_at);

CREATE INDEX IF NOT EXISTS moderation_steps_run_id_idx
ON moderation.moderation_steps (run_id);

CREATE INDEX IF NOT EXISTS moderation_decisions_comment_id_idx
ON moderation.moderation_decisions (comment_id);

CREATE INDEX IF NOT EXISTS moderation_decisions_run_id_idx
ON moderation.moderation_decisions (run_id);

CREATE INDEX IF NOT EXISTS moderation_feedback_examples_created_at_idx
ON moderation.feedback_examples (created_at);

INSERT INTO moderation.guidelines (
    id,
    code,
    title,
    description,
    severity,
    examples,
    metadata
)
VALUES
    (
        '10000000-0000-4000-8000-000000000001',
        'R-001',
        'Spam e autopromocao',
        'Comentarios promocionais, repetitivos ou sem relacao com o curso nao sao permitidos.',
        'medium',
        '["Confira meu canal para ganhar dinheiro rapido", "Promocao externa sem relacao com a aula"]'::jsonb,
        '{"seed":"moderation_guidelines_v1"}'::jsonb
    ),
    (
        '10000000-0000-4000-8000-000000000002',
        'R-002',
        'Ataques pessoais',
        'Ataques pessoais, assedio ou tentativas de humilhar outras pessoas nao sao permitidos.',
        'high',
        '["Voce e ridiculo por pensar assim", "Professor incompetente e lixo humano"]'::jsonb,
        '{"seed":"moderation_guidelines_v1"}'::jsonb
    ),
    (
        '10000000-0000-4000-8000-000000000003',
        'R-003',
        'Linguagem ofensiva',
        'Linguagem ofensiva ou agressiva deve ser tratada com cautela e pode exigir moderacao.',
        'medium',
        '["Comentario com xingamento direto", "Tom depreciativo e hostil"]'::jsonb,
        '{"seed":"moderation_guidelines_v1"}'::jsonb
    ),
    (
        '10000000-0000-4000-8000-000000000004',
        'R-004',
        'Discriminacao ou discurso de odio',
        'Conteudo discriminatorio, desumanizante ou de odio contra grupos protegidos nao e permitido.',
        'critical',
        '["Comentario preconceituoso sobre origem", "Ataque a grupo protegido"]'::jsonb,
        '{"seed":"moderation_guidelines_v1"}'::jsonb
    ),
    (
        '10000000-0000-4000-8000-000000000005',
        'R-005',
        'Conteudo perigoso ou ilegal',
        'Instrucoes para dano, violencia, fraude ou atividade ilegal nao sao permitidas.',
        'critical',
        '["Ensinar golpe", "Orientacao para machucar alguem"]'::jsonb,
        '{"seed":"moderation_guidelines_v1"}'::jsonb
    ),
    (
        '10000000-0000-4000-8000-000000000006',
        'R-006',
        'Critica legitima permitida',
        'Criticas educadas, honestas e relacionadas ao curso sao permitidas, mesmo quando negativas.',
        'low',
        '["A aula foi confusa para mim", "Nao gostei da explicacao deste topico"]'::jsonb,
        '{"seed":"moderation_guidelines_v1"}'::jsonb
    ),
    (
        '10000000-0000-4000-8000-000000000007',
        'R-007',
        'Duvidas e pedidos de suporte',
        'Perguntas de alunos e pedidos de ajuda devem ser preservados quando feitos de forma adequada.',
        'low',
        '["Nao entendi a etapa 3, alguem pode ajudar?", "Onde encontro o material complementar?"]'::jsonb,
        '{"seed":"moderation_guidelines_v1"}'::jsonb
    ),
    (
        '10000000-0000-4000-8000-000000000008',
        'R-008',
        'Feedback positivo ou neutro',
        'Feedback positivo, agradecimentos e comentarios neutros normalmente nao exigem moderacao.',
        'low',
        '["A aula ajudou bastante", "Obrigado pela explicacao"]'::jsonb,
        '{"seed":"moderation_guidelines_v1"}'::jsonb
    )
ON CONFLICT (code) DO NOTHING;

INSERT INTO moderation.comments (
    id,
    author_name,
    course_name,
    lesson_name,
    content,
    status,
    metadata
)
VALUES
    (
        '20000000-0000-4000-8000-000000000001',
        'Marina Silva',
        'Python para Iniciantes',
        'Instalacao do Ambiente',
        'Pessoal, sigam meu perfil para conhecer meu curso completo com desconto imperdivel.',
        'pending',
        '{"seed_case":"clear_spam"}'::jsonb
    ),
    (
        '20000000-0000-4000-8000-000000000002',
        'Carlos Mendes',
        'SQL na Pratica',
        'Joins Essenciais',
        'Sua explicacao foi pessima e voce claramente nao sabe ensinar isso.',
        'pending',
        '{"seed_case":"obvious_insult"}'::jsonb
    ),
    (
        '20000000-0000-4000-8000-000000000003',
        'Fernanda Rocha',
        'Python para Iniciantes',
        'Funcoes',
        'Achei a aula corrida demais e senti falta de mais exemplos praticos.',
        'pending',
        '{"seed_case":"legitimate_criticism"}'::jsonb
    ),
    (
        '20000000-0000-4000-8000-000000000004',
        'Joao Pedro',
        'Git e GitHub',
        'Branches',
        'Nao entendi quando usar rebase em vez de merge. Alguem pode explicar com outro exemplo?',
        'pending',
        '{"seed_case":"student_question"}'::jsonb
    ),
    (
        '20000000-0000-4000-8000-000000000005',
        'Patricia Lima',
        'Docker do Zero',
        'Containers',
        'Excelente aula, agora finalmente consegui entender a diferenca entre imagem e container.',
        'pending',
        '{"seed_case":"positive_feedback"}'::jsonb
    ),
    (
        '20000000-0000-4000-8000-000000000006',
        'Rafael Costa',
        'SQL na Pratica',
        'Consultas Avancadas',
        'Nossa, que explicacao genial... quase dormi tentando acompanhar esse exemplo.',
        'pending',
        '{"seed_case":"ambiguous_sarcasm"}'::jsonb
    ),
    (
        '20000000-0000-4000-8000-000000000007',
        'Luciana Araujo',
        'Comunidade e Carreira',
        'Networking',
        'Gente desse grupo sempre estraga a discussao e nao deveria participar da comunidade.',
        'pending',
        '{"seed_case":"potentially_discriminatory"}'::jsonb
    ),
    (
        '20000000-0000-4000-8000-000000000008',
        'Eduardo Santos',
        'Seguranca Digital',
        'Boas Praticas',
        'Se quiser derrubar a conta de alguem, o jeito mais facil e compartilhar a senha em um grupo e agir rapido.',
        'pending',
        '{"seed_case":"dangerous_or_illegal"}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;
