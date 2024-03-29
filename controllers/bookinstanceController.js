const Book = require('../models/book');
const BookInstance = require('../models/bookinstance');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

exports.bookinstance_list = asyncHandler(async (req, res, next) => {
	const allBookInstances = await BookInstance.find()
		.populate("book")
		.exec();
  // res.json({ allBookInstances });
	res.render("bookinstance_list", {
		title: "Book Instance List",
		bookinstance_list: allBookInstances,
	}) 
})

exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
	const bookInstance = await BookInstance.findById(req.params.id)
		.populate("book")
		.exec();

	if(bookInstance === null) {
		const err = new Error("Book copy not found");
		err.status(404);
		return next(err);
	}

	res.render("bookinstance_detail", {
		title: "Book:",
		bookinstance: bookInstance,
	});
});

exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
	const allBooks = await Book.find({}, "title")
		.sort({ title: 1 }).exec();

	res.render("bookinstance_form", {
		title: "Create BookInstance",
		book_list: allBooks,
	})
})

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];


exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
	const bookinstance = await BookInstance.findById(req.params.id).exec();
  if(bookinstance === null){
    res.redirect("/catalog/bookinstances");
  }
  // res.json({ bookinstance });
  res.render("bookinstance_delete", {
    title: "Delete BookInstance",
    bookinstance: bookinstance,
  });
})

exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
	await BookInstance.findByIdAndDelete(req.body.id).exec();
  res.redirect("/catalog/bookinstances");
})

exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
	const [bookinstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate("book").exec(),
    Book.find({}, "title").sort({ title: 1 }).exec(),
  ]);
  if(bookinstance === null){
    const err = new Error("BookInstance not found");
    err.status = 400;
    return next(err);
  }
  res.render("bookinstance_form", {
    title: "Update BookInstance",
    book_list: allBooks,
    selected_book: bookinstance.book._id,
    bookinstance: bookinstance,
  });
})

exports.bookinstance_update_post = [
  body("book", "Book name must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Imprint must be at least 3 character")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  body("status", "Status must be specified")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  body("due_back", "Invalid Date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if(!errors.isEmpty()){
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "Update BookInstance",
        bookinstance: bookinstance,
        selected_book: bookinstance.book._id,
        book_list: allBooks,
        errors: errors.array(),
      });
      return;
    } else {
      const updatedInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance);
      res.redirect(updatedInstance.url);
    }
  }),
];