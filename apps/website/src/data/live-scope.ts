import * as DiscordComponents from "@arcscord/discord-ui";
import React, { useEffect, useRef, useState } from "react";
import { initialChannel, markdown, release, ticket, welcome } from "./examples";

export const demoMedia = {
  id: "landscape",
  url: "/examples/landscape.svg",
  alt: "Illustrated mountains beneath a blue sky",
  width: 600,
  height: 320,
};
export const previewEntities = {
  users: {
    "123456789012345678": { name: "Alex" },
  },
};

export const liveScope = {
  ...DiscordComponents,
  React,
  useState,
  useEffect,
  useRef,
  initialChannel,
  welcome,
  release,
  ticket,
  markdown,
  demoMedia,
};
