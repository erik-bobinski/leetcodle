import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

function getLocalTimeString(): string {
  // Create a date object for today at 12:00 AM UTC
  const utcMidnight = new Date();
  utcMidnight.setUTCHours(0, 0, 0, 0);

  // Convert to local time
  const localDate = new Date(utcMidnight);

  // Format the time
  const hours = localDate.getHours();
  const minutes = localDate.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  // Get timezone abbreviation
  const timeZone = Intl.DateTimeFormat("en", {
    timeZoneName: "short"
  })
    .formatToParts(localDate)
    .find((part) => part.type === "timeZoneName")?.value;

  return `${displayHours}:${displayMinutes} ${ampm} ${timeZone}`;
}

export default function HelpModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const localTimeString = getLocalTimeString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl will-change-transform dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="flex-1"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leetcodle FAQ
          </h2>
          <div className="flex flex-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Cross2Icon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          <div>
            <h3 className="mb-3 text-center text-lg font-semibold text-gray-900 dark:text-white">
              How it works
            </h3>
            <p className="text-center leading-relaxed text-gray-700 dark:text-gray-300">
              Leetcodle is a daily coding challenge inspired by Wordle. Each day
              you get a new programming problem to solve at 12:00AM UTC (
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {localTimeString}
              </span>
              ). You have five attempts to write an algorithm to solve the five
              hidden test cases, each one you get correct will be revealed in
              the grid. What you write is exactly what gets submitted — ensure
              you import any libraries before using them. Check out the archive
              to see your history of problems you&apos;ve solved, and login to
              solve previous problems. Good luck!
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <h3 className="mb-2 text-center text-lg font-semibold text-blue-900 dark:text-blue-100">
                Send me a DM!
              </h3>
              <p className="mb-3 text-center text-blue-800 dark:text-blue-200">
                Wanna reach out with a bug, suggestion, or just to chat?
              </p>
              <div className="flex justify-center">
                <a
                  href="https://twitter.com/erikbobinski"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @erikbobinski
                </a>
              </div>
            </div>
            <div className="flex-1 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <h3 className="mb-2 text-center text-lg font-semibold text-blue-900 dark:text-blue-100">
                This app is open source!
              </h3>
              <p className="mb-3 text-center text-blue-800 dark:text-blue-200">
                Check out the repo if you&apos;re curious or want to contribute
              </p>
              <div className="flex justify-center">
                <a
                  href="https://github.com/erik-bobinski/leetcodle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  @erik-bobinski/leetcodle
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center border-t border-gray-200 p-6 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 italic dark:text-gray-400">
            Of course, this app has no affiliation with LeetCode.
          </p>
        </div>
      </div>
    </div>
  );
}
