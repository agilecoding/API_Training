How to use it:

Open an empty folder in VS Code.
Copy the prompt file into that folder’s .github/prompts/.
Open Copilot Chat, switch to Agent mode, and type /create-api-training-kit.


What makes it work well with Copilot:

It works in phases, with a check after each one. Phase 1 builds the API and tests it with curl, Phase 2 builds Karate and runs mvn test, and Phase 3 writes the guide. Copilot’s agent does better in checked stages than when generating everything at once.
Exact specs instead of descriptions: every endpoint, status code, error message, seed user and test zip code is written out. That way the guide, the API and the tests can’t disagree with each other.
The lessons from building this project are written in as rules. These are the mistakes Copilot would otherwise make, because most of its training examples are Karate 1.x:
karate-junit6 and JUnit 6.1.2 (not karate-junit5), and the io.karatelabs.* package names.
The six Karate 2.1.2 quirks that caused failing runs. One example: descriptions under Feature: that start with @ silently stop the Background from running.
Port 18090 instead of 8090, with a clear error message when the port is taken.
The fix for the PKIX certificate error on Windows.
A “definition of done” checklist: Copilot has to prove that the tests pass and that a broken test fails the build before it reports back.

The prompt also asks for a Troubleshooting section in the guide, covering the problems you hit today: “site can’t be reached”, Cannot GET /, a port already in use, and data resetting on restart. Your current guide doesn’t have that section yet; I can add it now if you like.

The prompt file is new, so it isn’t in your first commit yet. To include it on GitHub:
git add .github/prompts
git commit -m "Add Copilot prompt to rebuild the training kit"
