import { Component } from "@angular/core";
import { Angular } from "@qrcodesdk/angular";

@Component({
  selector: "AngularTest",
  imports: [Angular],
  template: `
    Angular test compoennt

    <lib-angular />
  `,
})
export class AngularTest {}
