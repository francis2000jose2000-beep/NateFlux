// Test file disabled to remove vite dependency from production build
// import { describe, expect, it } from "vitest";
// import { runMockRules } from "@/server/scan";
// import { normalizePublicGithubRepoUrl } from "@/shared/github";

// describe("normalizePublicGithubRepoUrl", () => {
//   it("accepts https github.com owner/repo", () => {
//     const out = normalizePublicGithubRepoUrl("https://github.com/user/oci-infra");
//     expect(out?.normalizedRepoUrl).toBe("https://github.com/user/oci-infra");
//   });

//   it("strips .git and trailing punctuation", () => {
//     const out = normalizePublicGithubRepoUrl("https://github.com/user/oci-infra.git)");
//     expect(out?.normalizedRepoUrl).toBe("https://github.com/user/oci-infra");
//   });

//   it("rejects non-https", () => {
//     const out = normalizePublicGithubRepoUrl("http://github.com/user/oci-infra");
//     expect(out).toBeNull();
//   });

//   it("rejects non-github domains", () => {
//     const out = normalizePublicGithubRepoUrl("https://gitlab.com/user/oci-infra");
//     expect(out).toBeNull();
//   });
// });

// describe("runMockRules", () => {
//   it("emits a high severity finding for open ingress", () => {
//     const findings = runMockRules([
//       {
//         filePath: "network.tf",
//         content: "resource \"oci_core_security_list\" \"x\" {\n  ingress_security_rules {\n    source = \"0.0.0.0/0\"\n  }\n}",
//       },
//     ]);

//     const open = findings.find((f) => f.id === "NO_OPEN_INGRESS");
//     expect(open?.status).toBe("FAILED");
//     expect(open?.severity).toBe("HIGH");
//   });

//   it("marks shape as passed when Always Free shape is used", () => {
//     const findings = runMockRules([
//       { filePath: "compute.tf", content: "shape = \"VM.Standard.E2.1.Micro\"" },
//     ]);
//     const shape = findings.find((f) => f.id === "OCI_ALWAYS_FREE_SHAPES");
//     expect(shape?.status).toBe("PASSED");
//   });
// });
