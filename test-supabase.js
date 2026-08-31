const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://lwkccijmxdwvlzsbnhkc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3a2NjaWpteGR3dmx6c2JuaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzOTk2MTcsImV4cCI6MjA5ODk3NTYxN30.ioxvol3oBbmKnSKg_ClmE7UgsYIYyXxtbeq6-z1eGOA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing connection...");

  const { data, error } = await supabase.from("sessions").select("*").limit(1);

  if (error) {
    console.log("ERROR:", JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS:", data);
  }
}

test();
