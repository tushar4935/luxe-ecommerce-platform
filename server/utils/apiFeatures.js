/**
 * Reusable query builder for Mongoose. Chains search / filter / sort /
 * paginate based on an Express query string, then `.execute()` returns the
 * (still un-awaited) Mongoose query so the caller can `.populate()` etc.
 *
 * Usage:
 *   const features = new APIFeatures(Product.find(), req.query)
 *     .search().filter().sort().paginate();
 *   const products = await features.execute();
 */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.filters = {}; // accumulates the raw filter object for count queries
  }

  /** Full-text-ish search on name / brand / description via regex OR. */
  search() {
    const term = this.queryString.search;
    if (term && term.trim()) {
      const regex = new RegExp(term.trim(), 'i');
      const searchFilter = {
        $or: [{ name: regex }, { brand: regex }, { description: regex }, { tags: regex }],
      };
      this.query = this.query.find(searchFilter);
      Object.assign(this.filters, searchFilter);
    }
    return this;
  }

  /** category / brand / price range / rating / size / color filters. */
  filter() {
    const q = this.queryString;
    const filter = {};

    if (q.category) {
      // category can be a comma-separated list of ObjectIds
      const ids = q.category.split(',').filter(Boolean);
      if (ids.length) filter.category = { $in: ids };
    }

    if (q.brand) {
      const brands = q.brand.split(',').filter(Boolean);
      if (brands.length) filter.brand = { $in: brands };
    }

    // Price range — applied against the discounted price when present is
    // handled at the controller layer; here we filter the base price field.
    const priceFilter = {};
    if (q.minPrice) priceFilter.$gte = Number(q.minPrice);
    if (q.maxPrice) priceFilter.$lte = Number(q.maxPrice);
    if (Object.keys(priceFilter).length) filter.price = priceFilter;

    if (q.rating) filter.ratings = { $gte: Number(q.rating) };

    if (q.size) {
      const sizes = q.size.split(',').filter(Boolean);
      if (sizes.length) filter.sizes = { $in: sizes };
    }

    if (q.color) {
      const colors = q.color.split(',').filter(Boolean);
      if (colors.length) filter['colors.name'] = { $in: colors };
    }

    if (q.featured === 'true') filter.isFeatured = true;

    this.query = this.query.find(filter);
    Object.assign(this.filters, filter);
    return this;
  }

  /** Sort by a friendly key, default newest first. */
  sort() {
    const map = {
      newest: '-createdAt',
      oldest: 'createdAt',
      'price-asc': 'price',
      'price-desc': '-price',
      popular: '-sold',
      'top-rated': '-ratings',
    };
    const sortBy = map[this.queryString.sort] || '-createdAt';
    this.query = this.query.sort(sortBy);
    return this;
  }

  /** page / limit (defaults: page 1, limit 12). */
  paginate() {
    this.page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    this.limit = Math.min(60, parseInt(this.queryString.limit, 10) || 12);
    const skip = (this.page - 1) * this.limit;
    this.query = this.query.skip(skip).limit(this.limit);
    return this;
  }

  execute() {
    return this.query;
  }
}

module.exports = APIFeatures;
