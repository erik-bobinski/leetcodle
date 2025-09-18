"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

export default function HelpModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

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
              Leetcodle is a daily coding challenge inspired by Wordle. Each
              day, you get a new programming problem to solve at 12:00AM UTC.
              You have five attempts to write an algorithm to solve the five
              hidden test cases, each one you get correct will be revealed in
              the grid. What you write is what gets submitted — ensure you
              import any libraries before using them. Check out the archive to
              see your history of problems you&apos;ve solved, and login to
              solve previous problems. Good luck!
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="mb-2 text-center text-lg font-semibold text-blue-900 dark:text-blue-100">
              Send me a DM
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
