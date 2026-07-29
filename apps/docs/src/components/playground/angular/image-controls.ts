import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideImage, lucideImagePlus, lucideTrash2} from '@ng-icons/lucide';
import {HlmAlertImports} from '@spartan-ng/helm/alert';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';

import {
  clearPlaygroundImage,
  playgroundImageStatus,
  playgroundPreparedImage,
  preparePlaygroundImage,
  updatePlaygroundImage,
} from '../playground-config.ts';

@Component({
  selector: 'playground-image-controls',
  imports: [
    FormsModule,
    HlmAlertImports,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSwitchImports,
    NgIcon,
  ],
  providers: [provideIcons({lucideImage, lucideImagePlus, lucideTrash2})],
  template: `
    <fieldset hlmFieldSet>
      <legend hlmFieldLegend>Center image</legend>
      <p hlmFieldDescription>Upload and decode an image before it is passed to the QR renderer.</p>

      <div class="border-border bg-muted/30 flex min-w-0 items-center gap-3 rounded-lg border p-3">
        <div
          class="border-border bg-background grid size-14 shrink-0 place-items-center overflow-hidden rounded-md border">
          @if (preparedImage(); as image) {
            <img
              class="size-full object-contain"
              [src]="image.dataUrl"
              alt=""
              width="56"
              height="56" />
          } @else {
            <ng-icon class="text-muted-foreground text-xl" name="lucideImage" />
          }
        </div>

        <div class="grid min-w-0 flex-1 gap-1">
          <p class="truncate text-sm font-medium">
            @if (preparedImage(); as image) {
              {{ image.fileName }}
            } @else if (status().state === 'loading') {
              Preparing image…
            } @else {
              No image selected
            }
          </p>
          <p class="text-muted-foreground text-xs">
            The image remains local to this browser session.
          </p>
        </div>

        <input
          class="sr-only"
          #imageInput
          (change)="selectImage($event)"
          type="file"
          accept="image/*" />
        <button
          [disabled]="status().state === 'loading'"
          (click)="imageInput.click()"
          hlmBtn
          type="button"
          variant="outline"
          size="sm">
          <ng-icon name="lucideImagePlus" />
          {{ preparedImage() ? 'Replace' : 'Upload' }}
        </button>
        @if (preparedImage()) {
          <button
            (click)="removeImage(imageInput)"
            aria-label="Remove center image"
            title="Remove center image"
            hlmBtn
            type="button"
            variant="ghost"
            size="icon-sm">
            <ng-icon name="lucideTrash2" />
          </button>
        }
      </div>

      @if (status().state === 'error') {
        <hlm-alert variant="destructive">
          <h4 hlmAlertTitle>Image preparation failed</h4>
          <p hlmAlertDescription>{{ status().message }}</p>
        </hlm-alert>
      }

      @if (preparedImage(); as image) {
        <div class="grid gap-4 md:grid-cols-2" hlmFieldGroup>
          <div hlmField>
            <label hlmFieldLabel for="image-size">Relative size</label>
            <input
              id="image-size"
              [ngModel]="image.size"
              (ngModelChange)="updatePlaygroundImage({size: $event})"
              hlmInput
              type="number"
              min="0.01"
              max="1"
              step="0.05" />
            <p hlmFieldDescription>Fraction of the QR matrix width, from 0.01 to 1.</p>
          </div>

          <div hlmField>
            <label hlmFieldLabel for="image-padding">Clear padding</label>
            <input
              id="image-padding"
              [ngModel]="image.padding"
              (ngModelChange)="updatePlaygroundImage({padding: $event})"
              hlmInput
              type="number"
              min="0"
              step="0.25" />
            <p hlmFieldDescription>Padding around the image in QR module units.</p>
          </div>

          <div class="md:col-span-2" hlmField orientation="horizontal">
            <div hlmFieldContent>
              <label hlmFieldLabel for="clear-image-background">Clear modules behind image</label>
              <p hlmFieldDescription>Paint the light color below the image and its padding.</p>
            </div>
            <hlm-switch
              [checked]="image.clearBackground"
              (checkedChange)="updatePlaygroundImage({clearBackground: $event})"
              inputId="clear-image-background" />
          </div>
        </div>

        <p class="text-muted-foreground text-xs">
          Error correction was set to H when the image was prepared. Large images can still make a
          QR code impossible to scan.
        </p>
      }
    </fieldset>
  `,
})
export class PlaygroundImageControls {
  private readonly nanostores = inject(NanostoresService);

  protected readonly preparedImage = toSignal(this.nanostores.useStore(playgroundPreparedImage), {
    requireSync: true,
  });
  protected readonly status = toSignal(this.nanostores.useStore(playgroundImageStatus), {
    requireSync: true,
  });
  protected readonly updatePlaygroundImage = updatePlaygroundImage;

  protected async selectImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    await preparePlaygroundImage(file);
    input.value = '';
  }

  protected removeImage(input: HTMLInputElement): void {
    clearPlaygroundImage();
    input.value = '';
  }
}
