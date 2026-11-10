# BUNSO M/A BASIC SCHOOL Website

A responsive school website built with HTML, CSS and JavaScript.

## Website sections
- Home and school introduction
- School news and announcements
- Programmes and events calendar
- Photo gallery populated from published news images
- Contact and location information
- Staff publishing dashboard at `admin.html`

## Important: connect shared publishing
The public website is static until a Supabase project is connected. This is intentional: local browser storage is not used because school announcements must be shared with all visitors and devices.

1. Create a project at https://supabase.com/.
2. Open the project's **SQL Editor** and run all the commands in `supabase-setup.sql`.
3. In Supabase **Project Settings → API**, copy the Project URL and the anon/public key.
4. Edit `config.js` and replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with those values. The anon key is intended for browser use; never put a service-role key in website files.
5. In Supabase **Authentication → Users**, create accounts for trusted school staff. Disable public sign-up if it is enabled; staff accounts should be created by an administrator.
6. Publish the repository with GitHub Pages: repository **Settings → Pages → Deploy from a branch → main → /(root) → Save**.

After setup:
- Public visitors can read published news and programmes.
- Staff open `admin.html`, sign in, and publish news, optional photos and event details.
- Images are uploaded to the public `school-media` storage bucket.
- Staff can delete news and events from the dashboard.

## Files
- `index.html` — public website
- `styles.css` — responsive styling
- `app.js` — public content loading
- `admin.html` and `admin.js` — staff publishing area
- `config.js` — Supabase browser configuration
- `supabase-setup.sql` — database tables, access policies and image bucket

## Before launch
Replace the generic school contact text with the school's approved telephone number, email address and any official social links. Add the school's approved crest/logo and photographs. Only publish photographs and personal information when the school has permission to do so.