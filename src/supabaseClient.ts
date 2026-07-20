import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://emgczjqpdwujbsfhjbtk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZ2N6anFwZHd1amJzZmhqYnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTc0MzMsImV4cCI6MjA5OTg5MzQzM30.07z70CoFjKqpMKmZJmxCr7p0T2seSXFZ0G7DTxxwGfA';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'mharaty',
  },
});