import Handlebars from "handlebars";

export function registerPartials() {
  Handlebars.registerPartial("documentHeader", `
    <header class="document-header">
      <strong>{{institution}}</strong>
      <span>{{documentDate}}</span>
    </header>
  `);
}
