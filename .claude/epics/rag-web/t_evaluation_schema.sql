-- t_evaluation table schema for Dental RAG System
-- Source: Existing business database table
-- Purpose: Conversation storage, cost tracking, and business analytics

CREATE TABLE `t_evaluation` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `rid` int(10) DEFAULT NULL COMMENT '治疗记录唯一ID',
  `account_id` varchar(50) DEFAULT NULL COMMENT '用户账户ID',
  `session_id` varchar(100) DEFAULT NULL COMMENT 'API生成，用于关联单次会话的多个API调用',
  `api_type` varchar(50) DEFAULT NULL COMMENT 'API调用类型 ''upload'', ''generate_report'', ''chat'', ''literature_search'', ''update_additional_data''',
  `report_type` varchar(50) DEFAULT NULL COMMENT '报告类型 ''patient'', ''gp'', ''specialist'' 仅当api_type为generate_report时有值',
  `report_content` mediumtext COMMENT '报告内容 仅当api_type为generate_report时有值',
  `user_message` mediumtext COMMENT '用户消息 仅当api_type为chat时有值',
  `ai_response` mediumtext COMMENT 'AI回复 仅当api_type为chat时有值',
  `request_data` mediumtext COMMENT '请求数据',
  `response_data` mediumtext COMMENT '响应数据',
  `model_used` varchar(50) DEFAULT NULL COMMENT '使用的AI模型',
  `input_tokens` int(10) DEFAULT NULL COMMENT '输入Token数量',
  `output_tokens` int(10) DEFAULT NULL COMMENT '输出Token数量',
  `created_at` datetime DEFAULT NULL COMMENT '作成日時',
  `updated_at` datetime DEFAULT NULL COMMENT '更新日時',
  PRIMARY KEY (`id`),
  KEY `idx_account_created` (`account_id`,`created_at`) USING BTREE,
  KEY `idx_rid_api_type` (`rid`,`api_type`) USING BTREE,
  KEY `idx_session_id` (`session_id`) USING BTREE,
  KEY `idx_report_type` (`report_type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估数据表';

-- CHAT CONVERSATION MAPPING
-- For chat functionality, we use:
-- - session_id: Groups multiple chat messages into a conversation
-- - api_type: 'chat' for chat messages
-- - user_message: User input for chat
-- - ai_response: AI response for chat
-- - account_id: Links to authenticated user
-- - created_at: Message timestamp

-- CONVERSATION STRUCTURE:
-- Each conversation = unique session_id
-- Each message = one record with api_type='chat'
-- User message and AI response stored in same record

-- API TYPE VALUES:
-- - 'upload': File upload operations
-- - 'generate_report': Report generation
-- - 'chat': Chat conversation messages
-- - 'literature_search': Literature search operations
-- - 'update_additional_data': Data updates