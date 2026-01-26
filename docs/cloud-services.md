# Cloud Services Setup Guide

This document lists the required services and how to obtain the API keys for the Stock Analysis Platform.

## 1. Supabase (Database)
- **Use**: PostgreSQL database for storing analysis cache and logs.
- **Setup**:
  1. Create account at [supabase.com](https://supabase.com).
  2. Create a new project.
  3. Get the `DATABASE_URL` from Project Settings -> Database.
- **Limits**: 500MB database, 5GB bandwidth (Free Tier).

## 2. Upstash (Caching)
- **Use**: Redis for distributed caching and rate limiting.
- **Setup**:
  1. Create account at [upstash.com](https://upstash.com).
  2. Create a new Redis database.
  3. Get the `REDIS_URL` and token.
- **Limits**: 10,000 commands per day (Free Tier).

## 3. Google AI Studio (Gemini)
- **Use**: Gemini API for educational notes and final report polish.
- **Setup**:
  1. Go to [ai.google.dev](https://ai.google.dev).
  2. Create an API key.
- **Limits**: 60 RPM, 1500 RPD (Free Tier).

## 4. Groq Cloud (Llama 3 / Mixtral)
- **Use**: Groq for fast contrarian perspective analysis.
- **Setup**:
  1. Create account at [console.groq.com](https://console.groq.com).
  2. Generate an API key.
- **Limits**: 14,400 RPD (Llama 3 70B Free Tier).

## 5. OpenAI
- **Use**: GPT-4 for deep foundational analysis.
- **Setup**: Use existing credits from [platform.openai.com](https://platform.openai.com).
- **Env**: `OPENAI_API_KEY`.

## Environment Variables Summary
| Variable | Service | Required |
| --- | --- | --- |
| `DATABASE_URL` | Supabase | Yes |
| `REDIS_URL` | Upstash | Yes |
| `GEMINI_API_KEY` | Google AI | Yes |
| `GROQ_API_KEY` | Groq | Yes |
| `OPENAI_API_KEY` | OpenAI | Yes |
