<script lang="ts">
  import { get } from 'svelte/store';
  import { accessTokenValue, userAvatar } from '../../stores/authStore';
  import EasyCrop from 'svelte-easy-crop';
	import { handleGetAvatar } from '../../services/settingsService';
	import { toast } from '@zerodevx/svelte-toast';

  export let onSave: (data: { avatar?: File | null; defaultAvatar?: boolean | null}) => void;
  export let onClose: () => void;

  // It will call the preview generation function after loading the image
  // When we reset to the Default we want to skip that with this boolean
  let resetDefault = false;
  let defaultAvatar = false;
  let crop = { x: 0, y: 0 };
  let zoom = 1;
  let aspect = 1;
  const originalAvatarUrl = get(userAvatar);
  let imageToCrop: string = originalAvatarUrl;
  let croppedImage: string | null = imageToCrop;

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function dataURLtoBlob(dataURL: string): Blob {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }
  function handleSave() {
    const data: { avatar?: File | null; defaultAvatar?: boolean | null } = {};
    if (croppedImage) {
      const blob = dataURLtoBlob(croppedImage);
      const file = new File([blob], 'cropped-avatar.png', { type: 'image/png' });
      data.avatar = file;
      data.defaultAvatar = defaultAvatar;
    }
    onSave(data);
  }

  function handleBackToDefault() {
    const accessToken = $accessTokenValue;
    if (accessToken) {
      handleGetAvatar(accessToken, true).then((response) => {
        if (response.success) {
          if (response.avatar) {
            imageToCrop = response.avatar;
            croppedImage = response.avatar;
            defaultAvatar = true;
            resetDefault = true;
          }
        } else {
          toast.push('Failed to fetch avatar', {
            theme: {
              '--toastColor': '#000000',
              '--toastBackground': '#EE4B2B',
              '--toastBarBackground': '#4A0404'
            }
          })
        }
      });
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imageToCrop = e.target?.result as string;
          croppedImage = null;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imageToCrop = e.target?.result as string;
          croppedImage = null;
        };
        reader.readAsDataURL(file);
      }
    }
  }

 let latestCropPixels: { x: number; y: number; width: number; height: number } | null = null;
  let debounceTimer: ReturnType<typeof setTimeout>;

  function onCropComplete(e: { percent: any; pixels: { x: number; y: number; width: number; height: number } }) {
    latestCropPixels = e.pixels;
    debouncePreview();
  }

  function debouncePreview() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generatePreview, 300); // Debounce for 300ms
  }

  async function generatePreview() {
    if (!latestCropPixels || !imageToCrop) return;
    const image = new Image();
    image.src = imageToCrop;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement('canvas');
    canvas.width = latestCropPixels.width;
    canvas.height = latestCropPixels.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      image,
      latestCropPixels.x,
      latestCropPixels.y,
      latestCropPixels.width,
      latestCropPixels.height,
      0,
      0,
      latestCropPixels.width,
      latestCropPixels.height
    );
    croppedImage = canvas.toDataURL('image/png');
    if (!resetDefault) {
      defaultAvatar = false;
    } else {
      resetDefault = true;
    }
  }

  function handleMouseUp() {
    debouncePreview();
  }

  function handleWheel() {
    debouncePreview();
  }
</script>

<div
  class="modal"
  on:click={handleOverlayClick}
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleOverlayClick(e as unknown as MouseEvent);
    }
  }}
  tabindex="0"
  role="dialog"
  aria-modal="true"
>
  <div class="modal-content">
    <h2>Edit Profile</h2>
    <div class="avatar-section">
      <div class="avatar-edit-container">
        <div
          class="crop-section"
          on:dragover={handleDragOver}
          on:drop={handleDrop}
          tabindex="0"
          role="dialog"
          aria-modal="true"
        >
          <p class="avatar-label">Crop Avatar</p>
          <div
            class="cropper-container"
            on:mouseup={handleMouseUp}
            on:wheel={handleWheel}
            tabindex="0"
            role="dialog"
            aria-modal="true"
          >
            <EasyCrop
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              oncropcomplete={onCropComplete}
            />
          </div>
        </div>
        {#if croppedImage}
          <div
            class="cropped-preview-section"
            on:dragover={handleDragOver}
            on:drop={handleDrop}
            tabindex="0"
            role="dialog"
            aria-modal="true"
          >
            <p class="avatar-label">Cropped Preview</p>
            <img src={croppedImage} alt="Cropped Avatar" class="avatar-box" />
          </div>
        {/if}
        <div class="avatar-upload">
          <input type="file" on:change={handleFileInput} accept="image/*" class="field-input" />
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button on:click={handleSave}>Save</button>
      <button on:click={onClose}>Cancel</button>
      {#if !defaultAvatar}
        <button on:click={handleBackToDefault}>Reset to default</button>
      {/if}
    </div>
  </div>
</div>


<style>
  /* Your existing styles here */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border: none;
    padding: 0;
    margin: 0;
    cursor: default;
  }
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 400px;
    text-align: center;
    position: relative;
  }
  .modal-content h2 {
    margin-top: 0;
    color: #2c3e50;
  }
  .avatar-section {
    position: relative;
    display: flex;
    justify-content: center;
    margin: 1rem auto;
  }
  .avatar-edit-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .avatar-box {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #3498db;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: calc(30vh * 0.4);
    border-radius: 4px;
  }
  .avatar-upload {
    margin-top: 0.5rem;
  }
  .field-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    text-align: center;
  }
  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }
  .modal-actions button {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .modal-actions button:hover {
    background: #2980b9;
  }
  .modal-actions button:last-child {
    background: #e74c3c;
  }
  .modal-actions button:last-child:hover {
    background: #c0392b;
  }
  .cropper-container {
    width: 30vh;
    height: 30vh;
    max-width: 300px;
    max-height: 300px;
    position: relative;
    margin-bottom: 1rem;
  }
  .crop-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .cropped-preview-section {
    width: 30vh;
    height: 30vh;
    max-width: 300px;
    max-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .crop-section,
  .cropped-preview-section {
    border: 2px dashed transparent;
    transition: border-color 0.2s;
  }
  .cropped-preview-section .avatar-label {
    margin: 0;
    font-size: 0.8rem;
    color: #27ae60;
  }
</style>
