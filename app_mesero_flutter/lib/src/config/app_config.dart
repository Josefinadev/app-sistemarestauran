class AppConfig {
  static const apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://orderly-delta-cyan.vercel.app/api',
  );

  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://bkcaoijyzunfkntcjzcd.supabase.co',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrY2FvaWp5enVuZmtudGNqemNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzIwOTEsImV4cCI6MjA5MTE0ODA5MX0.gVmIIztTOJXzngX0C3ex8FGeZk4BPykyuKaQwM__13I',
  );
}
