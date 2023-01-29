drop schema if exists blog_app cascade;
create schema blog_app;

create table blog_app.users (
  "id" serial primary key,
  "user_login" varchar(256) not null unique,
  "user_email" varchar(256) not null unique,
  "user_role" integer not null default 0,
  "user_password" varchar(256) not null,
  "user_avatar" text not null default 'https://www.gravatar.com/avatar/00000000000000000000000000000000',
  "created_at" timestamp not null default now(),
  "updated_at" timestamp default null
);

insert into blog_app.users (id, user_login, user_email, user_role, user_password)
  values (1, 'admin', 'admin@example.net', 1, '$2y$10$BQZ1QrAzOTkiTUH.Zkc8P.NsOj8yevQw/MwWuY7RM5vNTGsupucI.')
;

create table blog_app.sites (
  "id" serial primary key,
  "user_id" serial references blog_app.users(id),
  "site_name" varchar(256),
  "created_at" timestamp not null default now(),
  "updated_at" timestamp default null
);

insert into blog_app.sites (id, user_id, site_name)
  values (1, 1, 'Admin blogs')
;

create table blog_app.posts (
  "id" serial primary key,
  "site_id" serial references blog_app.sites(id),
  "user_id" serial references blog_app.users(id),
  "post_type" varchar(20) not null default 'posts',
  "post_title" varchar(256),
  "post_slug" varchar(256) not null unique,
  "post_content" text,
  "post_status" integer not null default 0,
  "created_at" timestamp not null default now(),
  "updated_at" timestamp default null,
  unique (site_id, user_id, post_type, post_slug)
);

insert into blog_app.posts (id, site_id, user_id, post_type, post_title, post_slug, post_content, post_status)
  values (1, 1, 1, 'posts', 'Hello World', 'hello-world', 'This is just example blog posts\nYou can remove safely.', 1)
;

create table blog_app.tags (
  "id" serial primary key,
  "tags_type" varchar not null,
  "tags_id" integer not null,
  "tags_slug" varchar(256) not null,
  "tags_name" varchar(256),
  "tags_description" varchar (512),
  "tags_parent" integer references blog_app.tags(id),
  "created_at" timestamp not null default now(),
  "updated_at" timestamp default null,
  unique (tags_type, tags_id, tags_slug)
);

-- a posts category
insert into blog_app.tags (tags_type, tags_id, tags_slug, tags_name, tags_description)
  values ('blog_app.posts_category', 1, 'uncategorized', 'Uncategorized', 'A category contains un categorized posts')
;

-- a posts tags
insert into blog_app.tags (tags_type, tags_id, tags_slug, tags_name, tags_description)
  values ('blog_app.posts_tags', 1, 'untagged', 'Untagged', 'A untagged posts')
;

-- create metadata table
create table blog_app.meta (
  "id" serial primary key,
  "meta_type" varchar(256) not null,
  "meta_id" integer not null,
  "meta_key" varchar(256) not null,
  "meta_value" jsonb not null,
  unique (meta_type, meta_id, meta_key)
);