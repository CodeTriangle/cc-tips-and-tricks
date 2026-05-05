## CrossCode Tips and Tricks GUI

A versatile tips and tricks menu for the CrossCode modding community.

By default, this mod instantiates a little menu
in the top-left of the pause screen,
which cycles between mod-defined tips,
an example of which you can see here:

https://github.com/user-attachments/assets/6f3d11fc-c5fa-4ce7-b80e-c9b01f6d8fd6

### Adding tips from your mod

The easiest way to add tips is through a JSON patch.
Simply create `assets/data/tip-database.patch`
and fill it with something like this:

```js
{
  "codetriangle.tt.example": {
    "title": "An example hint",
    "body": "The hint body",
    "contributor": "CodeTriangle"
  },
  "codetriangle.tt.example2": {
    "title": "An example hint",
    "body": "This hint was submitted anonymously"
  },
  "codetriangle.tt.localized": {
    "title": {
      "en_US": "Localized hints"
    },
    "body": {
      "en_US": "It even supports localization!"
    },
    "contributor": "CodeTriangle"
  }
}
```

Some notes:

1. PLEASE namespace your hints. All hint keys MUST be unique; you will receive load errors if there are collisions. In this example I used `<username>.<mod>.<hint>` as a template.
2. Only `body` is required. `title` and `contributor` are optional, and will only be shown if they are given.
3. Each of `title`, `body`, and `contributor` can be individually localized.

### Advanced interaction

The best way to get an idea of the interfaces that exist
is by reading [tips-and-tricks.d.ts](./tips-and-tricks.d.ts).
But here's an overview:

```js
codetriangle.tt.model.addTip(key, tip, enabled?);
```

Adds a tip.
See the above section
for information on keys and tip object specifications.
By default, tips are enabled.

```js
codetriangle.tt.model.setTipEnabled(key, enabled);
```

Allows for on-the-fly modification
of what tips can and should appear
in the tip GUIs.
All existing tip GUIs will immediately update
to reflect this status.

```js
new codetriangle.tt.TipsAndTricksGui(config?);
```

Create a GUI that will display
a cycling sequence of tips.
See the `codetriangle.tt.TipsAndTricksGui.Config` interface
for details on how to configure this.
Static, non-cycling tips are supported,
but the code is not optimized for that.
