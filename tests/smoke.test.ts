import { expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "../src/app/(public)/page";

test("the public shell identifies ICG with an accessible main heading", () => {
  const html = renderToStaticMarkup(createElement(HomePage));
  expect(html).toContain('<main id="main-content">');
  expect(html).toContain("<h1>ICG</h1>");
  expect(html).toContain("Integrated Communications Group");
});
