import { gql } from "@apollo/client";

//Will load user data and saved bookd in SavedBook.js
export const QUERY_ME = gql`
	{
		me {
			_id
			username
			email
			savedBooks {
				bookId
				authors
				image
				description
				title
				link
			}
		}
	}
`;