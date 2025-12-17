<script lang="ts">
    export let onSave: () => void;
    export let onClose: () => void;

    function handleOverlayClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }
</script>

<div
    class="modal"
    on:click={handleOverlayClick}
    on:keydown={(e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }}
    tabindex="0"
    role="dialog"
    aria-modal="true"
>
    <div class="modal-content">
        <h2>Delete Account</h2>
        <p>Are you sure you want to permanently delete your account? This action cannot be undone.</p>
        <div class="modal-actions">
            <button on:click={onClose}>Cancel</button>
            <button on:click={onSave}>Delete</button>
        </div>
    </div>
</div>

<style>
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
    .modal-content p {
        color: #7f8c8d;
        margin: 1rem 0;
    }
    .modal-actions {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.5rem;
    }
    .modal-actions button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
    }
    .modal-actions button:first-child {
        background: #f0f0f0;
        color: #34495e;
    }
    .modal-actions button:first-child:hover {
        background: #e0e0e0;
    }
    .modal-actions button:last-child {
        background: #e74c3c;
        color: white;
    }
    .modal-actions button:last-child:hover {
        background: #c0392b;
    }
</style>
