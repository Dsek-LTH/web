import { spawn } from "child_process";

/*
MIT License

Copyright (c) 2019-2023 Frazer Smith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const errorMessages = {
  0: "No Error",
  1: "Error opening a PDF file",
  2: "Error opening an output file",
  3: "Error related to PDF permissions",
  4: "Error related to ICC profile",
  99: "Other error",
  3221226505: "Internal process error",
};

export async function pdfToText(buffer) {
  try {
    return new Promise((resolve, reject) => {
      const args = ["-", "-"]; // Read from stdin, write to stdout
      const child = spawn("pdftotext", args);

      child.stdin.write(buffer);
      child.stdin.end();

      let stdOut = "";
      let stdErr = "";

      child.stdout.on("data", (data) => {
        stdOut += data;
      });

      child.stderr.on("data", (data) => {
        stdErr += data;
      });

      child.on("close", (code) => {
        if (stdOut !== "") {
          resolve(stdOut.trim());
        } else if (code === 0) {
          resolve(errorMessages[code]);
        } else if (stdErr !== "") {
          reject(new Error(stdErr.trim()));
        } else {
          reject(
            new Error(
              errorMessages[code] ||
                `pdftotext ${args.join(" ")} exited with code ${code}`,
            ),
          );
        }
      });
    });
  } catch (error) {
    Promise.reject(error);
  }
}
