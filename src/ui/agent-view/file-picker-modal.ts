import { App, Modal, TFile, Setting } from 'obsidian';
import { shouldExcludePathForPlugin } from '../../utils/file-utils';
import { naturalCompare } from '../../utils/sort-utils';
import { fuzzyMatch, fuzzyScore } from '../../utils/fuzzy-match-utils';
import type ObsidianGemini from '../../main';

export class FilePickerModal extends Modal {
	private onSelect: (files: TFile[]) => void;
	private selectedFiles: Set<TFile> = new Set();
	private plugin: InstanceType<typeof ObsidianGemini>;
	private allFiles: TFile[] = [];
	private filteredFiles: TFile[] = [];
	private fileListContainer: HTMLElement | null = null;
	private searchInput: HTMLInputElement | null = null;

	constructor(app: App, onSelect: (files: TFile[]) => void, plugin: InstanceType<typeof ObsidianGemini>) {
		super(app);
		this.onSelect = onSelect;
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Add Context Files' });

		// Get all markdown files in the vault, excluding system and plugin folders
		const allMarkdownFiles = this.app.vault.getMarkdownFiles();
		this.allFiles = allMarkdownFiles
			.filter((file) => !shouldExcludePathForPlugin(file.path, this.plugin))
			.sort((a, b) => naturalCompare(a.path, b.path));

		// Create search container
		const searchContainer = contentEl.createDiv({ cls: 'gemini-file-picker-search-container' });
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search files...',
			cls: 'gemini-file-picker-search',
		});

		// Create file list container
		this.fileListContainer = contentEl.createDiv({ cls: 'gemini-file-picker-list' });

		// Add search event listener
		this.searchInput.addEventListener('input', () => {
			this.filterAndRenderFiles(this.searchInput!.value);
		});

		// Add keydown listener for Enter key
		this.searchInput.addEventListener('keydown', (e) => {
			if (e.isComposing) {
				return;
			}

			if (e.key === 'Enter' && this.filteredFiles.length > 0) {
				e.preventDefault();
				const topFile = this.filteredFiles[0];
				this.updateSelection(topFile, true);
				this.renderFileList();
			} else if (e.key === 'Escape') {
				this.searchInput!.value = '';
				this.filterAndRenderFiles('');
			}
		});

		// Add buttons
		const buttonContainer = contentEl.createDiv({ cls: 'gemini-file-picker-buttons' });

		const selectButton = buttonContainer.createEl('button', {
			text: 'Add Selected Files',
			cls: 'mod-cta',
		});

		selectButton.addEventListener('click', () => {
			this.onSelect(Array.from(this.selectedFiles));
			this.close();
		});

		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
		});

		cancelButton.addEventListener('click', () => {
			this.close();
		});

		// Initial render with all files
		this.filterAndRenderFiles('');

		// Focus search input for convenience
		this.searchInput.focus();
	}

	private updateSelection(file: TFile, selected: boolean) {
		if (selected) {
			this.selectedFiles.add(file);
		} else {
			this.selectedFiles.delete(file);
		}
	}

	private filterAndRenderFiles(query: string) {
		if (!query.trim()) {
			// No search query - show all files in natural sort order
			this.filteredFiles = [...this.allFiles];
		} else {
			// Filter and score matches
			const matches = this.allFiles
				.filter((file) => fuzzyMatch(query, file.path))
				.sort((a, b) => {
					const scoreA = fuzzyScore(query, a.path);
					const scoreB = fuzzyScore(query, b.path);
					// Higher scores first
					return scoreB - scoreA;
				});

			this.filteredFiles = matches;
		}

		this.renderFileList();
	}

	private renderFileList() {
		if (!this.fileListContainer) {
			return;
		}

		// Clear the list
		this.fileListContainer.empty();

		// Add each file as a checkbox option
		this.filteredFiles.forEach((file, index) => {
			const fileItem = this.fileListContainer!.createDiv({ cls: 'gemini-file-picker-item' });

			// Add highlight class to the first item
			if (index === 0) {
				fileItem.addClass('gemini-file-picker-item-highlighted');
			}

			const checkbox = fileItem.createEl('input', {
				type: 'checkbox',
				value: file.path,
			});

			// Check if this file was previously selected
			if (this.selectedFiles.has(file)) {
				checkbox.checked = true;
			}

			const label = fileItem.createEl('label', {
				text: file.path,
				cls: 'gemini-file-picker-label',
			});

			label.addEventListener('click', () => {
				checkbox.checked = !checkbox.checked;
				this.updateSelection(file, checkbox.checked);
			});

			checkbox.addEventListener('change', () => {
				this.updateSelection(file, checkbox.checked);
			});
		});

		// Show message if no results
		if (this.filteredFiles.length === 0) {
			const noResults = this.fileListContainer.createDiv({ cls: 'gemini-file-picker-no-results' });
			noResults.setText('No files found');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
