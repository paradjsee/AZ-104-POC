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

Edit [`src/questions.json`](./src/questions.json) to add questions. Each entry has an `id`, `question`, `questionType` (`single` or `multiple`), an array of `{ "id", "text" }` options, `correctAnswers`, `explanation`, and an optional `topic`.

The supplied source dataset has 90 questions. Its verified answers are used where available; the two entries without a verified answer use the source-provided answer and are flagged in the app. Missing explanations are displayed with a fallback message.

## Practice flow

Choose one or multiple options, then select **Check Answer**. The app marks the correct answers, displays the explanation, and locks that attempt. Use the navigation buttons to move between questions. The **Review Wrong Questions** mode lets you retry missed questions; progress and scoring are never written to browser storage.

The question order is randomized for the session across all 90 questions. Use **All Questions** to work through the complete randomized list, or **50 Câu / Lượt** to work through it in batches: 50 questions first, then the remaining 40 questions. The batch mode shows progress, a completion summary, and an option to continue to the remaining batch.
