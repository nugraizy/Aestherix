export class ComixResponse {
	constructor({ comix, items, pageInfo, context }) {
		this.comix = comix;
		this.items = items || [];
		this.pageInfo = pageInfo || { page: 1, lastPage: 1, hasNext: false };
		this.context = context || {};
	}

	hasNext() {
		return Boolean(this.pageInfo?.hasNext);
	}

	nextPage() {
		if (typeof this.context.nextPage !== 'function') {
			throw new Error('No next page available');
		}

		return this.context.nextPage();
	}

	hasPrev() {
		return Boolean(this.pageInfo?.hasPrev);
	}

	prevPage() {
		if (typeof this.context.prevPage !== 'function') {
			throw new Error('No previous page available');
		}

		return this.context.prevPage();
	}

	getDetail(index = 0) {
		if (!this.items.length) {throw new Error('No items available');}

		return this.comix.getDetail(this.items[index]);
	}

	getChapters(index = 0, options = {}) {
		if (this.context.type === 'detail' && this.context.item) {
			return this.comix.getChapters(this.context.item, options);
		}

		if (!this.items.length) {throw new Error('No items available');}

		return this.comix.getChapters(this.items[index], options);
	}

	getChapterPages(chapterInput) {
		if (!chapterInput && this.items.length) {
			return this.comix.getChapterPages(this.items[0]);
		}

		return this.comix.getChapterPages(chapterInput);
	}
}

export class ComixItemResponse extends ComixResponse {
	constructor({ comix, item }) {
		super({
			comix,
			items: [item],
			pageInfo: { page: 1, lastPage: 1, hasNext: false },
			context: { type: 'detail', item }
		});
	}

	getDetail() {
		return Promise.resolve(this);
	}
}
