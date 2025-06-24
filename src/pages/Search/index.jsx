import React from "react";
import SearchResult from "../../components/SearchResult";

const Search = ({ }) => {
    const searchQuery = new URLSearchParams(location.search).get('term') || '';
    return (
        <div className="searchPage">
            <SearchResult searchQuery={searchQuery}/>
        </div>
    );
};

export default Search;