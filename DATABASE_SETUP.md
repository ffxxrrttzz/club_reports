# Database Setup Instructions

## Overview
This document describes how to set up the Supabase tables required for the club reporting system.

## Required Tables

### 1. clubs
Stores available clubs that can be selected in the form.

```sql
CREATE TABLE clubs (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default clubs
INSERT INTO clubs (name) VALUES 
  ('Клуб А'),
  ('Клуб Б'),
  ('Клуб В');
```

### 2. directions
Stores activity directions (КДН, ДПИ, Спортивное, Социальное, Патриотическое).

```sql
CREATE TABLE directions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default directions
INSERT INTO directions (name) VALUES 
  ('КДН'),
  ('ДПИ'),
  ('Спортивное'),
  ('Социальное'),
  ('Патриотическое');
```

### 3. sections
Stores sections (clubs) for each direction with supervisor information.

```sql
CREATE TABLE sections (
  id BIGSERIAL PRIMARY KEY,
  direction VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  supervisor VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(direction, name),
  FOREIGN KEY (direction) REFERENCES directions(name) ON DELETE CASCADE
);

-- Insert default sections
INSERT INTO sections (direction, name, supervisor) VALUES 
  -- КДН
  ('КДН', 'Шахматы', 'Иванов Иван Иванович'),
  ('КДН', 'Рисование', 'Петрова Анна Сергеевна'),
  ('КДН', 'Музыка', 'Сидоров Пётр Николаевич'),
  -- ДПИ
  ('ДПИ', 'Керамика', 'Сидорова Мария Петровна'),
  ('ДПИ', 'Вышивка', 'Козлов Дмитрий Андреевич'),
  ('ДПИ', 'Лепка', 'Волкова Елена Сергеевна'),
  -- Спортивное
  ('Спортивное', 'Футбол', 'Смирнов Алексей Владимирович'),
  ('Спортивное', 'Баскетбол', 'Волкова Елена Сергеевна'),
  ('Спортивное', 'Плавание', 'Николаев Игорь Петрович'),
  -- Социальное
  ('Социальное', 'Волонтёры', 'Николаева Ольга Петровна'),
  ('Социальное', 'Помощь пожилым', 'Александрова Татьяна Ивановна'),
  -- Патриотическое
  ('Патриотическое', 'Юнармия', 'Петров Сергей Иванович'),
  ('Патриотическое', 'Поисковый отряд', 'Васильев Андрей Михайлович');
```

### 4. users (for authentication)
Stores user accounts for managers.

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  club_id BIGINT,
  role VARCHAR(50) DEFAULT 'manager',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_club_id ON users(club_id);
```

## Setup Steps in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query and paste each table creation script
4. Execute the scripts in this order: clubs → directions → sections → users
5. Verify that all tables have been created correctly

## Existing Tables

The following table already exists and should remain unchanged:
- **reports**: Contains all submitted reports with the structure defined in `types/database.ts`

## Notes

- The ComboBox component allows users to add new values to clubs, directions, and sections
- When a new club is added, it will be stored in the `clubs` table
- When a new direction is added, it will be stored in the `directions` table
- When a new section is added, it will be stored in the `sections` table with the selected direction
- The `users` table will be populated during the authentication phase
