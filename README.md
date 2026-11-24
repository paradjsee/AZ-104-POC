# AZ-104 Practice Test

A small, local React + TypeScript practice app. Answers and progress are kept only in React memory and reset when the page is refreshed.

## Run locally

1. Install Node.js (version 20.19+ or 22.12+).
2. From this folder, install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open the local URL printed by Vite.

To create and preview a production build, run `npm run build` and then `npm run preview`.

## Questions

The app uses [src/questions.json](./src/questions.json), normalized from [raw/az104_questions.json](./raw/az104_questions.json). [raw/scenario_groups.json](./raw/scenario_groups.json) maps question IDs to scenario groups. The source supplies 135 questions. Two entries without a source ID use local IDs 301 and 302. The app uses the source-provided answer where a verified answer is missing and flags those entries for review.

## Practice flow

Choose one of the three fixed tests (50, 50, and 35 questions), then start in ascending ID order or random order. Random order shuffles questions within the selected test. Choose **Check Answer** to see the result and explanation. **Review Wrong Questions** lets you retry missed questions from all tests. Switching tests or question order keeps your answers for the current page session.
