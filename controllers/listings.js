const { cloudinary } = require("../cloudConfig");
const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const {category, search} = req.query;
  let query = {};
  if(search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { location: new RegExp(search, "i") },
    ];
    }
  
  if(category) {
    query.category = category;
  }
  const allListings = await Listing.find(query);
  res.render("listings/index.ejs", { allListings, category, search });
};

module.exports.renderNewForm = (req, res) => {
  // console.log(req.user);

  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const {search} = req.query;
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing doesn't exist.");
    res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing , search});
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
  })
    .send()
  

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);

  newListing.owner = req.user._id;
  newListing.image = {url, filename};
  newListing.geometry = response.body.features[0].geometry;
  // console.log(newListing.category);
  
  let savedListing = await newListing.save();
  // console.log(savedListing);
  
  req.flash("success", "New Listing created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing doesn't exist.");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl.replace("/upload", "/upload/h_300,w_250");
  res.render("listings/edit.ejs", { listing , originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if(typeof req.file !== "undefined"){
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image = {url, filename};
  await listing.save();
  }
  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  if(!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const publicId = listing.image.filename;
  if(publicId) {
    await cloudinary.uploader.destroy(publicId);
  }

  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing deleted");
  res.redirect("/listings");
};
