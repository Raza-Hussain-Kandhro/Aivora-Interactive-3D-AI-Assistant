import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StateBadge } from "./StateBadge";

describe("StateBadge", () => {
  it("shows the current bot state", () => {
    render(<StateBadge />);

    expect(screen.getByRole("status")).toHaveTextContent("Idle");
  });
});