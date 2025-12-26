-- Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Document',
  content jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  position_from integer not null,
  position_to integer not null,
  resolved boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.documents enable row level security;
alter table public.comments enable row level security;

-- Documents policies
create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can create own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Comments policies
create policy "Users can view comments on own documents"
  on public.comments for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = comments.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can create comments on own documents"
  on public.comments for insert
  with check (
    exists (
      select 1 from public.documents
      where documents.id = document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.handle_updated_at();

-- Create indexes for performance
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_updated_at_idx on public.documents(updated_at desc);
create index if not exists comments_document_id_idx on public.comments(document_id);
