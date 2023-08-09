import React, { useState, useEffect } from "react";
import { Container, Col, Form, Button, Card, CardColumns } from "react-bootstrap";
import Auth from "../utils/auth";
import { SAVE_BOOK } from "../utils/mutations";
import { useMutation } from "@apollo/client";
import { searchGoogleBooks } from "../utils/API";
import { saveBookIds, getSavedBookIds } from "../utils/localStorage";

const SearchBooks = () => {
	// > create state for holding returned data from Google Books API
	const [searchedBooks, setSearchedBooks] = useState([]);

	// > create state for holding our search field data
	const [searchInput, setSearchInput] = useState("");

	// > create state to hold saved bookId values
	const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

	// > create state to hold the status of our saveBook mutation
	const [saveBook] = useMutation(SAVE_BOOK);

	// > set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
	// > learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
	useEffect(() => {
		return () => saveBookIds(savedBookIds);
	});

	// > create method to search for books and set state on form submit
	const handleFormSubmit = async (event) => {
		event.preventDefault();

		if (!searchInput) {
			return false;
		}

		try {
			const response = await searchGoogleBooks(searchInput);

			if (!response.ok) {
				throw new Error("something went wrong!");
			}

			const { items } = await response.json();

			const bookData = items.map((book) => ({
				bookId: book.id,
				authors: book.volumeInfo.authors || ["No author to display"],
				title: book.volumeInfo.title,
				description: book.volumeInfo.description,
				image: book.volumeInfo.imageLinks?.thumbnail || "",
			}));

			// > set the state of searchedBooks to the returned data from the API after mapping over the array of results
			setSearchedBooks(bookData);
			setSearchInput("");
		} catch (err) {
			console.error(err);
		}
	};

	// > Create function to handle saving a book to our database and update savedBookIds state on success
	const handleSaveBook = async (bookId) => {
		// > find the book in `searchedBooks` state by the matching id
		const bookToSave = searchedBooks.find((book) => book.bookId === bookId);

		const token = Auth.loggedIn() ? Auth.getToken() : null;

		if (!token) {
			return false;
		}

		try {
			const { data } = await saveBook({
				variables: { bookData: { ...bookToSave } },
			});

			// > If book successfully saves to user's account, save book id to state
			setSavedBookIds([...savedBookIds, bookToSave.bookId]);
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<>
			<div fluid className="text-light bg-dark">
				<Container>
					<h1>Search for Books!</h1>
					<Form onSubmit={handleFormSubmit}>
						<Form.Row>
							<Col xs={12} md={8}>
								<Form.Control
									name="searchInput"
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									type="text"
									size="lg"
									placeholder="Search for a book"
								/>
							</Col>
							<Col xs={12} md={4}>
								<Button type="submit" variant="success" size="lg">
									Submit Search
								</Button>
							</Col>
						</Form.Row>
					</Form>
				</Container>
			</div>

			<Container>
				<h2>
					{searchedBooks.length ? `Viewing ${searchedBooks.length} results:` : "Search for a book to begin"}
				</h2>
				<CardColumns>
					{searchedBooks.map((book) => {
						return (
							<Card key={book.bookId} border="dark">
								{book.image ? (
									<Card.Img src={book.image} alt={`The cover for ${book.title}`} variant="top" />
								) : null}
								<Card.Body>
									<Card.Title>{book.title}</Card.Title>
									<p className="small">Authors: {book.authors}</p>
									<Card.Text>{book.description}</Card.Text>
									{Auth.loggedIn() && (
										<Button
											disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
											className="btn-block btn-info"
											onClick={() => handleSaveBook(book.bookId)}
										>
											{savedBookIds?.some((savedBookId) => savedBookId === book.bookId)
												? "This book has already been saved!"
												: "Save this Book!"}
										</Button>
									)}
								</Card.Body>
							</Card>
						);
					})}
				</CardColumns>
			</Container>
		</>
	);
};

export default SearchBooks;