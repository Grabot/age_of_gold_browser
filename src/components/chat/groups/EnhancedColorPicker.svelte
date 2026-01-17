<script lang="ts">
    export let value: string = '#0b9476';
    export let onChange: (color: string) => void;

    // Predefined color palette for quick selection
    const predefinedColors = [
        '#FF6B6B', '#FF8E53', '#FFC154', '#48CF85', '#4299E1', '#5677FC',
        '#9013FE', '#ED64A6', '#F6AD55', '#FC8181', '#667EEA', '#764BA2',
        '#F093FB', '#4FACFE', '#00C9A7', '#8BD3DD', '#A5DD9B', '#F9D71C'
    ];

    // Handle color change from color wheel
    function handleColorChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const newColor = input.value;
        value = newColor;
        onChange(newColor);
    }

    // Handle predefined color selection
    function selectPredefinedColor(color: string) {
        value = color;
        onChange(color);
    }
</script>

<div class="color-picker-container">
    <div class="color-picker-header">
        <h4>Select Group Color</h4>
    </div>

    <div class="color-picker-main">
        <!-- Color Wheel -->
        <div class="color-wheel-section">
            <input
                type="color"
                bind:value
                on:input={handleColorChange}
                class="color-wheel"
            />
            <div class="color-preview" style="background-color: {value};"></div>
        </div>

        <!-- Predefined Colors -->
        <div class="predefined-colors">
            <h5>Quick Select</h5>
            <div class="color-grid">
                {#each predefinedColors as color}
                    <button
                        class="color-swatch"
                        style="background-color: {color};"
                        on:click={() => selectPredefinedColor(color)}
                        aria-label="Select color {color}"
                    ></button>
                {/each}
            </div>
        </div>
    </div>

    <!-- Current Color Display -->
    <div class="current-color">
        <span>Current: </span>
        <strong>{value}</strong>
        <button
            class="copy-btn"
            on:click={() => {
                navigator.clipboard.writeText(value);
                // Could add a toast notification here
            }}
        >
            Copy
        </button>
    </div>
</div>

<style>
    .color-picker-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .color-picker-header {
        text-align: center;
        margin-bottom: 0.5rem;
    }

    .color-picker-header h4 {
        margin: 0;
        color: #2c3e50;
        font-size: 1.1rem;
    }

    .color-picker-main {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .color-wheel-section {
        display: flex;
        align-items: center;
        gap: 1rem;
        justify-content: center;
    }

    .color-wheel {
        width: 80px;
        height: 80px;
        padding: 4px;
        border: 3px solid #ddd;
        border-radius: 50%;
        cursor: pointer;
        background: white;
    }

    .color-preview {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        border: 2px solid #ddd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .predefined-colors h5 {
        margin: 0 0 0.5rem 0;
        color: #666;
        font-size: 0.9rem;
        text-align: center;
    }

    .color-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;
        justify-content: center;
    }

    .color-swatch {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s;
        padding: 0;
        margin: 0;
    }

    .color-swatch:hover {
        transform: scale(1.1);
        border-color: #3498db;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .current-color {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #eee;
        font-size: 0.9rem;
        color: #666;
    }

    .copy-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background 0.2s;
    }

    .copy-btn:hover {
        background: #2980b9;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .color-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }
</style>